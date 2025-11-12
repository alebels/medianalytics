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

  // Store scroll position before updates to prevent jumps
  private savedScrollOffset = 0;

  // Flag to control whether to preserve scroll position during updates
  private shouldPreservePosition = true;

  // Cached total content size to avoid recalculating on every scroll event
  private cachedTotalContentSize = 0;

  // Threshold for considering scroll position significant enough to preserve (in pixels)
  private readonly scrollPositionThreshold = 100;
  
  // Threshold for scroll position delta before restoration (in pixels)
  private readonly scrollDeltaThreshold = 50;

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

  /**
   * Resets all internal state when datasource changes.
   * Clears caches and flags to ensure clean slate for new data.
   */
  reset(): void {
    this.itemSizeCache.clear();
    this.savedScrollOffset = 0;
    this.cachedTotalContentSize = 0;
    this.isLoadingMore = false;
    this.shouldPreservePosition = true;
    this.scrollToTop();
  }

  /**
   * Clears cached heights for items that may have changed size.
   * Call this when items are modified (e.g., URLs added) to prevent scroll jumps.
   * Preserves heights for currently rendered items to maintain scroll stability.
   * 
   * @param modifiedIndices - Optional array of specific indices that were modified.
   *                          If provided, only these will be invalidated.
   */
  invalidateItemSizeCache(modifiedIndices?: number[]): void {
    if (!this.viewport) {
      this.itemSizeCache.clear();
      return;
    }

    // If specific indices provided, only clear those
    if (modifiedIndices && modifiedIndices.length > 0) {
      const renderedRange = this.viewport.getRenderedRange();
      
      modifiedIndices.forEach(index => {
        // Only clear if it's currently rendered to avoid breaking scroll position
        if (index >= renderedRange.start && index < renderedRange.end) {
          this.itemSizeCache.delete(index);
        }
      });
      return;
    }

    // Preserve heights for currently rendered items to prevent jumps during scroll
    const renderedRange = this.viewport.getRenderedRange();
    const preservedHeights = new Map<number, number>();
    
    // Save currently visible item heights - these are accurate and shouldn't cause jumps
    for (let i = renderedRange.start; i < renderedRange.end; i++) {
      const cachedHeight = this.itemSizeCache.get(i);
      if (cachedHeight) {
        preservedHeights.set(i, cachedHeight);
      }
    }
    
    // Clear all cached heights
    this.itemSizeCache.clear();
    
    // Restore heights for visible items to prevent scroll position jumps
    preservedHeights.forEach((height, index) => {
      this.itemSizeCache.set(index, height);
    });
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
      // Save current scroll position before any updates
      this.savedScrollOffset = this.viewport.measureScrollOffset();
      
      this.updateTotalContentSize();
      this.updateRenderedRange();
      
      // Restore scroll position to prevent jumps when data changes
      // Only if position preservation is enabled
      if (this.shouldPreservePosition && this.savedScrollOffset > 0) {
        requestAnimationFrame(() => {
          if (this.viewport) {
            this.viewport.scrollToOffset(this.savedScrollOffset);
          }
        });
      }
      
      // Reset loading flag when new data arrives
      this.isLoadingMore = false;
    }
  }

  onContentRendered(): void {
    if (!this.viewport) return;

    // Save scroll position before measuring
    const currentScrollOffset = this.viewport.measureScrollOffset();
    
    this.measureRenderedItems();
    this.updateTotalContentSize();
    
    // Always preserve scroll position during content rendering if preservation is enabled
    // This is critical for preventing jumps when items change height (URL aggregation)
    if (this.shouldPreservePosition && currentScrollOffset > this.scrollPositionThreshold) {
      // Immediate restoration without waiting for RAF to minimize visible jump
      const newOffset = this.viewport.measureScrollOffset();
      if (Math.abs(newOffset - currentScrollOffset) > this.scrollDeltaThreshold) {
        this.viewport.scrollToOffset(currentScrollOffset);
      }
    }
  }

  onRenderedOffsetChanged(): void {
    // No-op for this strategy, keep for interface compliance
  }

  /**
   * Scrolls the viewport to the top (offset 0).
   * Temporarily disables position preservation to allow the scroll.
   */
  private scrollToTop(): void {
    if (!this.viewport) return;

    // Disable preservation to allow scroll to top
    this.shouldPreservePosition = false;
    
    // Scroll to top
    this.viewport.scrollToOffset(0);
    
    // Re-enable preservation immediately - safe because savedScrollOffset will be 0
    // which prevents restoration in onDataLengthChanged (checks savedScrollOffset > 0)
    this.shouldPreservePosition = true;
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
    
    // Use cached total content size for performance
    const distanceFromBottom = this.cachedTotalContentSize - (scrollOffset + viewportSize);
    
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
      const actualHeight = (item as HTMLElement).offsetHeight;
      
      if (actualHeight > 0) {
        this.itemSizeCache.set(index, actualHeight);
      }
    });

    // Update average item size based on all measured items
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
    this.cachedTotalContentSize = totalSize;
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
