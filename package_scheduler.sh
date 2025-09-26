#!/bin/bash

# 🧹 Clean up audit directory first to free up space
echo "🧹 Cleaning up audit directory..."
rm -rf audit
echo "✅ Audit directory cleaned."

# 📅 Timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# 📁 Nombre del archivo
archive_name="scheduler_base_configurator_$timestamp.tar.gz"

# 📄 Log file
log_file="package_log_$timestamp.txt"

# 📦 Exclusiones
exclusions=(
  "node_modules"
  ".next"
  "build"
  "coverage"
  ".git"
  "*.zip"
  "audit"
)

# 🧮 Auditoría previa
echo "📊 Folder size before packaging:" > "$log_file"
du -sh * | sort -hr >> "$log_file"

# 🧵 Construcción del comando tar
exclude_args=()
for path in "${exclusions[@]}"; do
  exclude_args+=("--exclude=$path")
done

# 🗜️ Crear archivo comprimido
tar "${exclude_args[@]}" -czf "$archive_name" .

# 📏 Validar tamaño final
final_size=$(ls -lh "$archive_name" | awk '{print $5}')
echo -e "\n✅ Archive created: $archive_name ($final_size)" >> "$log_file"
echo "🧾 Exclusions applied:" >> "$log_file"
printf '%s\n' "${exclusions[@]}" >> "$log_file"

# 📍 Mostrar log
cat "$log_file"
