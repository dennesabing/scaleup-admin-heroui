export interface GenderOption {
  value: string;
  label: string;
}

export const genders: GenderOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

export const getGenderByValue = (value: string): GenderOption | undefined => {
  return genders.find((gender) => gender.value === value);
};

export const getGenderByLabel = (label: string): GenderOption | undefined => {
  return genders.find(
    (gender) => gender.label.toLowerCase() === label.toLowerCase(),
  );
};
