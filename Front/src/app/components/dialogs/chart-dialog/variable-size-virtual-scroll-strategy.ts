import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

/**
 * Custom VirtualScrollStrategy for handling items with variable heights.
 * Measures actual item heights and calculates proper scroll dimensions.
 * Supports automatic data loading when user scrolls near the bottom.
 */
export class VariableSizeVirtualScrollStrategy {
  private viewport: CdkVirtualScrollViewport | null = null;
  
  // Estimated average item height - refined as items are measured
  private averageItemSize: number;
  
  // Buffer configuration for rendering extra items outside viewport
  private minBufferPx: number;
  private maxBufferPx: number;
  
  // Cache of measured item heights for accurate calculations
  private readonly itemSizeCache = new Map<number, number>();

  // Callback function to trigger when user scrolls near bottom
  private onNearBottomCallback: (() => void) | null = null;
  
  // Threshold distance from bottom to trigger load (in pixels)
  // Increased to 750px for earlier loading and better UX
  private readonly loadMoreThreshold = 750;
  
  // Flag to prevent multiple simultaneous load triggers
  private isLoadingMore = false;

  constructor(
    averageItemSize = 100,
    minBufferPx = 400,
    maxBufferPx = 800
  ) {
    this.averageItemSize = averageItemSize;
    this.minBufferPx = minBufferPx;
    this.maxBufferPx = maxBufferPx;
  }

  /**
   * Registers a callback to be invoked when user scrolls near the bottom.
   * @param callback - Function to call when near bottom is detected
   */
  setOnNearBottom(callback: () => void): void {
    this.onNearBottomCallback = callback;
  }

  /**
   * Resets the loading flag to allow the next load operation.
   * Should be called after load operation completes.
   */
  resetLoadingFlag(): void {
    this.isLoadingMore = false;
  }

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.updateTotalContentSize();
    this.updateRenderedRange();
  }

  detach(): void {
    this.viewport = null;
  }

  onContentScrolled(): void {
    if (this.viewport) {
      this.updateRenderedRange();
      this.checkIfNearBottom();
    }
  }

  onDataLengthChanged(): void {
    if (this.viewport) {
      this.updateTotalContentSize();
      this.updateRenderedRange();
      // Reset loading flag when new data arrives
      this.isLoadingMore = false;
    }
  }

  onContentRendered(): void {
    if (this.viewport) {
      this.measureRenderedItems();
      this.updateTotalContentSize();
    }
  }

  onRenderedOffsetChanged(): void {
    // No-op for this strategy, keep for interface compliance
  }

  /**
   * Checks if the user has scrolled near the bottom and triggers the callback if needed.
   * Uses a threshold to start loading before reaching the absolute bottom for smooth UX.
   */
  private checkIfNearBottom(): void {
    if (!this.viewport || !this.onNearBottomCallback || this.isLoadingMore) {
      return;
    }

    const scrollOffset = this.viewport.measureScrollOffset();
    const viewportSize = this.viewport.getViewportSize();
    
    // Use viewport's cached total content size instead of recalculating
    const totalContentSize = this.viewport.getDataLength() > 0 
      ? this.calculateTotalContentSize() 
      : 0;
      
    const distanceFromBottom = totalContentSize - (scrollOffset + viewportSize);
    
    if (distanceFromBottom < this.loadMoreThreshold) {
      this.isLoadingMore = true;
      this.onNearBottomCallback();
    }
  }

  /**
   * Calculates the total content size based on measured and estimated item heights.
   * Used both for updating viewport and checking scroll position.
   */
  private calculateTotalContentSize(): number {
    if (!this.viewport) return 0;
    
    const dataLength = this.viewport.getDataLength();
    let totalSize = 0;
    
    for (let i = 0; i < dataLength; i++) {
      totalSize += this.itemSizeCache.get(i) ?? this.averageItemSize;
    }
    
    return totalSize;
  }

  /**
   * Measures the actual heights of rendered items and updates the cache.
   * This improves accuracy of scroll calculations over time.
   */
  private measureRenderedItems(): void {
    if (!this.viewport) return;

    const renderedRange = this.viewport.getRenderedRange();
    const contentWrapper = this.viewport.elementRef.nativeElement.querySelector(
      '.cdk-virtual-scroll-content-wrapper'
    );

    if (!contentWrapper) return;

    const items = contentWrapper.querySelectorAll('.media-item-container');
    items.forEach((item, i) => {
      const index = renderedRange.start + i;
      const height = (item as HTMLElement).offsetHeight;
      if (height > 0) {
        this.itemSizeCache.set(index, height);
      }
    });

    // Update average item size based on measured items
    if (this.itemSizeCache.size > 0) {
      const totalSize = Array.from(this.itemSizeCache.values()).reduce(
        (sum, size) => sum + size,
        0
      );
      this.averageItemSize = totalSize / this.itemSizeCache.size;
    }
  }

  /**
   * Updates the viewport's total content size based on measured and estimated item heights.
   */
  private updateTotalContentSize(): void {
    if (!this.viewport) return;

    const totalSize = this.calculateTotalContentSize();
    this.viewport.setTotalContentSize(totalSize);
  }

  /**
   * Updates which items should be rendered based on current scroll position.
   */
  private updateRenderedRange(): void {
    if (!this.viewport) return;

    const scrollOffset = this.viewport.measureScrollOffset();
    const viewportSize = this.viewport.getViewportSize();
    const dataLength = this.viewport.getDataLength();

    if (dataLength === 0) {
      this.viewport.setRenderedRange({ start: 0, end: 0 });
      return;
    }

    // Find the first item that should be rendered
    let startIndex = this.findIndexAtOffset(scrollOffset - this.minBufferPx);
    startIndex = Math.max(0, startIndex);

    // Find the last item that should be rendered
    let endIndex = this.findIndexAtOffset(
      scrollOffset + viewportSize + this.maxBufferPx
    );
    endIndex = Math.min(dataLength, endIndex + 1);

    this.viewport.setRenderedRange({ start: startIndex, end: endIndex });

    // Set the offset for the rendered content
    const offsetToStart = this.getOffsetForIndex(startIndex);
    this.viewport.setRenderedContentOffset(offsetToStart);
  }

  /**
   * Finds the index of the item at a given scroll offset.
   */
  private findIndexAtOffset(offset: number): number {
    if (offset <= 0) return 0;

    const dataLength = this.viewport?.getDataLength() ?? 0;
    let currentOffset = 0;

    for (let i = 0; i < dataLength; i++) {
      const itemSize = this.itemSizeCache.get(i) ?? this.averageItemSize;
      currentOffset += itemSize;

      if (currentOffset >= offset) {
        return i;
      }
    }

    return Math.max(0, dataLength - 1);
  }

  /**
   * Calculates the scroll offset for a given item index.
   */
  private getOffsetForIndex(index: number): number {
    let offset = 0;

    for (let i = 0; i < index; i++) {
      offset += this.itemSizeCache.get(i) ?? this.averageItemSize;
    }

    return offset;
  }
}
