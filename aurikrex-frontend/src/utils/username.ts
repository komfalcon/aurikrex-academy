export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const isUsernameValid = (username: string) =>
  username.length >= USERNAME_MIN_LENGTH &&
  username.length <= USERNAME_MAX_LENGTH &&
  USERNAME_PATTERN.test(username);
