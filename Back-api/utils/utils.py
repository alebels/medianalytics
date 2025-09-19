import models.utils as schemas
from models.filters import CategoryValues


def categorize_items(items: list[schemas.ItemRead], category_groups: list[CategoryValues]) -> list[schemas.ItemRead]:
    """
    Categorize items based on category groups.
    
    Args:
        items: List of items with name and count
        category_groups: List of category groups with category and values
        
    Returns:
        List of categorized items
    """
    if not items or not category_groups:
        return []
        
    # Create a dictionary to store total count for each category
    category_totals = {}
    
    # Iterate through items and sum up counts for each category
    for item in items:
        for group in category_groups:
            if item.name in group.values:
                category_totals[group.category] = category_totals.get(group.category, 0) + item.count
                break
    
    # Sort the category totals by count in descending order
    category_totals = dict(sorted(category_totals.items(), key=lambda x: x[1], reverse=True))
    
    # Convert the dictionary to ItemRead objects
    return [
        schemas.ItemRead(name=category, count=count)
        for category, count in category_totals.items()
    ]


def normalize_data_item_dates(dated: list[schemas.ItemDate]) -> list[schemas.ItemDate]:
    """
    Process and normalize data for the response. 
    Fill with none if no count is found for a field in a specific date.
    
    Args:
        dated (list[schemas.ItemDate]): List of items with dates.
        
    Returns:
        list[schemas.ItemDate]: Normalized data for dates.
    """
    
    # Get all unique names and dates
    unique_names = set(item.name for item in dated)
    unique_dates = set(item.date for item in dated)
    
    # Create a dictionary to track existing entries
    existing_entries = {(item.name, item.date): item for item in dated}
    
    # Create complete dataset with None counts for missing entries
    normalized_data = []
    
    for name in unique_names:
        for date in unique_dates:
            if (name, date) in existing_entries:
                normalized_data.append(existing_entries[(name, date)])
            else:
                # Create a new item with count None for missing entries
                normalized_data.append(schemas.ItemDate(
                    name=name,
                    count=None,
                    date=date
                ))
    
    # Sort by date and then by name for consistent ordering
    return sorted(normalized_data, key=lambda x: (x.date, x.name))


def set_to_chart_normalized_data(
    normalized_data: list[schemas.ItemDate]
) -> list[schemas.DateChartRead]:
    """
    Convert normalized data into chart format with unique dates as labels and counts grouped by item name.
    
    Args:
        normalized_data (list[schemas.ItemDate]): List of items with dates and counts.
        
    Returns:
        list[schemas.DateChartRead]: Data formatted for charts with labels and item series.
    """
    # Extract all unique dates and sort them chronologically
    labels = sorted(set(item.date for item in normalized_data))
    
    # Group data by name
    name_to_data = {}
    for item in normalized_data:
        if item.name not in name_to_data:
            name_to_data[item.name] = {}
        name_to_data[item.name][item.date] = item.count or None
    
    # Create item series for each unique name
    items = []
    for name, date_counts in name_to_data.items():
        # For each label date, get the count or default to None if no data for that date
        serie = [date_counts.get(date, None) for date in labels]
        items.append(schemas.ItemSerie(name=name, data=serie))
    
    # Return a single DateChartRead object
    return schemas.DateChartRead(items=items, labels=labels)