'''
Supabase Integration
'''
from supabase import create_client, Client

GRID_ROWS = 2
GRID_COLUMNS = 10

gate_values = {
    'H_Gate': 1,
    'X_Gate': 2,
    'Y_Gate': 3,
    'Z_Gate': 4,
    'CNOT': None  # Assign a specific value if needed
}

# Initialize Supabase client
url: str = 'https://pqoamjlwwaiiazroyeev.supabase.co'
key: str = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb2Ftamx3d2FpaWF6cm95ZWV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTY1MjkyMiwiZXhwIjoyMDQ1MjI4OTIyfQ.yt9VkzeGkqVSQ7GB5dj50SEXGn7R8g15N8ZViCSIDfE'  # Use the service key for admin access
supabase: Client = create_client(url, key)

def fetch_gate_data():
    response = supabase.table('icon_positions').select('*').execute()
    if response.error:
        print('Error fetching gate data:', response.error)
        return []
    data = response.data
    return data

def reconstruct_grid(gate_data):
    grid = [[None for _ in range(GRID_COLUMNS)] for _ in range(GRID_ROWS)]

    for gate in gate_data:
        icon_type = gate['icon_type']
        position_x = gate['position_x']
        position_y = gate['position_y']

        if icon_type == 'CNOT':
            # Place the CNOT gate spanning both rows at position_x
            if position_y == 0:
                grid[0][position_x] = icon_type
                grid[1][position_x] = icon_type
            else:
                print(f"Warning: CNOT gate expected at position_y 0, found at {position_y}")
        else:
            grid[position_y][position_x] = icon_type

    return grid

def get_row_values(grid):
    row_outputs = []
    for row in grid:
        row_values = []
        for cell in row:
            if cell:
                value = gate_values.get(cell, 0)
                row_values.append(value if value is not None else 0)
            else:
                row_values.append(0)
        row_outputs.append(row_values)
    return row_outputs

if __name__ == '__main__':
    gate_data = fetch_gate_data()
    if gate_data:
        grid = reconstruct_grid(gate_data)
        row_outputs = get_row_values(grid)
        for idx, row in enumerate(row_outputs):
            print(f"Row {idx} Output: {row}")
        # Insert your processing logic here using row_outputs
    else:
        print("No gate data found.")