import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  InputAdornment,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Formik, Form } from "formik";
import { z } from "zod";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const TariffFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isEdit,
}) => {
  const { t } = useTranslation();

  const tariffSchema = z
    .object({
      name: z
        .string()
        .min(3, { message: t("name_min_length") })
        .max(50, { message: t("name_max_length") }),
      description: z
        .string()
        .max(500, { message: t("description_max_length") })
        .nullable(),
      price: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z
          .number()
          .min(0, { message: t("price_min") })
          .max(1000000, { message: t("price_max") })
      ),
      type: z.enum(["subscription", "one-time", "promotion"], {
        message: t("required"),
      }),
      period: z
        .preprocess(
          (val) => (val === "" ? undefined : Number(val)),
          z
            .number()
            .min(1, { message: t("period_min") })
            .max(365, { message: t("period_max") })
        )
        .optional(),
      isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.type === "subscription") {
        if (
          data.period === undefined ||
          data.period === null ||
          isNaN(data.period)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["period"],
            message: t("required"),
          });
        }
      }
    });

  const validate = (values) => {
    const result = tariffSchema.safeParse(values);
    if (result.success) return {};
    const errors = {};
    for (const issue of result.error.issues) {
      if (issue.path && issue.path.length > 0) {
        errors[issue.path[0]] = issue.message;
      }
    }
    return errors;
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t("edit_tariff") : t("create_tariff")}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (values, { setSubmitting }) => {
          if (values.type !== "subscription") {
            values.period = undefined;
          }
          console.log("SUBMIT", values);
          await onSubmit(values);
          setSubmitting(false);
        }}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form>
            <DialogContent>
              <Stack spacing={2}>
                <TextField
                  name="name"
                  label={t("name")}
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && Boolean(errors.name)}
                  helperText={
                    (touched.name && errors.name) || t("name_helper_text")
                  }
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t("name_tooltip")}>
                          <IconButton size="small">
                            <HelpOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  name="description"
                  label={t("description")}
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.description && Boolean(errors.description)}
                  helperText={
                    (touched.description && errors.description) ||
                    t("description_helper_text")
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t("description_tooltip")}>
                          <IconButton size="small">
                            <HelpOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  name="price"
                  label={t("price")}
                  type="number"
                  value={values.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.price && Boolean(errors.price)}
                  helperText={
                    (touched.price && errors.price) ||
                    (values.price && formatPrice(values.price)) ||
                    t("price_helper_text")
                  }
                  fullWidth
                  required
                  inputProps={{ min: 0, step: "0.01" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t("price_tooltip")}>
                          <IconButton size="small">
                            <HelpOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  name="type"
                  label={t("type")}
                  select
                  value={values.type}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value === "one-time")
                      setFieldValue("period", "");
                  }}
                  onBlur={handleBlur}
                  error={touched.type && Boolean(errors.type)}
                  helperText={
                    (touched.type && errors.type) || t("type_helper_text")
                  }
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t("type_tooltip")}>
                          <IconButton size="small">
                            <HelpOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="subscription">{t("subscription")}</MenuItem>
                  <MenuItem value="one-time">{t("one-time")}</MenuItem>
                  <MenuItem value="promotion">{t("promotion")}</MenuItem>
                </TextField>
                {values.type === "subscription" && (
                  <TextField
                    name="period"
                    label={t("period_days")}
                    type="number"
                    value={values.period || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.period && Boolean(errors.period)}
                    helperText={
                      (touched.period && errors.period) ||
                      t("period_helper_text")
                    }
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 365 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={t("period_tooltip")}>
                            <IconButton size="small">
                              <HelpOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.isActive}
                      onChange={(e) =>
                        setFieldValue("isActive", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{t("active")}</Typography>
                      <Tooltip title={t("active_tooltip")}>
                        <IconButton size="small">
                          <HelpOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>{t("cancel")}</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                color="primary"
              >
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

TariffFormDialog.defaultProps = {
  initialValues: {
    name: "",
    description: "",
    price: "",
    type: "subscription",
    period: undefined,
    isActive: true,
  },
  isEdit: false,
};

export default TariffFormDialog;
