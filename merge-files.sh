
#!/bin/bash

# Usage: ./concat_code_files.sh <source_directory> <output_file>
# Example: ./concat_code_files.sh ./my_project ./combined_code.txt

# Check if correct number of arguments were provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <source_directory> <output_file>"
    exit 1
fi

SOURCE_DIR="$1"
OUTPUT_FILE="$2"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory '$SOURCE_DIR' does not exist."
    exit 1
fi

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Find all code files and concatenate them to the output file
# This pattern includes common code file extensions
# Modify the -name pattern to include/exclude specific file types
find "$SOURCE_DIR" -type f \( -name "*.py" -o -name "*.js" -o -name "*.java" -o -name "*.c" -o -name "*.cpp" -o -name "*.h" -o -name "*.cs" -o -name "*.php" -o -name "*.rb" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.kt" -o -name "*.ts" -o -name "*.html" -o -name "*.css" -o -name "*.sh" -o -name "*.pl" -o -name "*.R" \) | sort | while read -r file; do
    # Get the relative path from the source directory
    rel_path="${file#$SOURCE_DIR/}"
    
    # Add a separator with the file path and name
    echo -e "\n\n==================================================================" >> "$OUTPUT_FILE"
    echo -e "FILE: $rel_path" >> "$OUTPUT_FILE"
    echo -e "==================================================================\n" >> "$OUTPUT_FILE"
    
    # Append the file content
    cat "$file" >> "$OUTPUT_FILE"
done

echo "All code files have been concatenated to '$OUTPUT_FILE'"
echo "Total files processed: $(grep -c "^FILE: " "$OUTPUT_FILE")"