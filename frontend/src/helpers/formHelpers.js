// Универсальный обработчик изменения формы
export function handleFormChange(setter, nestedFields = []) {
  return (e) => {
    const { name, value } = e.target;
    // Проверяем вложенные поля через точку
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setter((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setter((prev) => ({ ...prev, [name]: value }));
    }
  };
}
