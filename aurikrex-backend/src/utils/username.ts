export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const USERNAME_VALIDATION_MESSAGE =
  `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and contain only letters, numbers, and underscores`;

export const isUsernameValid = (username: string): boolean => {
  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
};
