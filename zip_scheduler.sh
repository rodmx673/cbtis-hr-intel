#!/bin/bash

# 📅 Timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# 📁 Nombre del ZIP
zip_name="scheduler_base_configurator.zip"

# 📄 Log file
log_file="zip_log_$timestamp.txt"

# 📦 Carpetas a excluir
exclusions=(
  "node_modules/*"
  ".next/*"
  "build/*"
  "coverage/*"
  ".git/*"
)

# 🧮 Auditoría previa
echo "📊 Folder size before zipping:" > "$log_file"
du -sh * | sort -hr >> "$log_file"

# 🧵 Construcción del comando ZIP
exclude_args=()
for path in "${exclusions[@]}"; do
  exclude_args+=("-x" "$path")
done

# 🗜️ Crear ZIP con exclusiones
zip -r "$zip_name" . "${exclude_args[@]}"

# 📏 Validar tamaño final
final_size=$(ls -lh "$zip_name" | awk '{print $5}')
echo -e "\n✅ ZIP created: $zip_name ($final_size)" >> "$log_file"
echo "🧾 Exclusions applied:" >> "$log_file"
printf '%s\n' "${exclusions[@]}" >> "$log_file"

# 📍 Mostrar log
cat "$log_file"
