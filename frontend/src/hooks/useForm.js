import { useState } from "react";
import { handleFormChange } from "../helpers/formHelpers";

export function useForm(initialValues, nestedFields = []) {
  const [values, setValues] = useState(initialValues);
  const handleChange = handleFormChange(setValues, nestedFields);
  return { values, handleChange, setValues };
}
