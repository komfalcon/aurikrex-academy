import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Falcon Focus",
  slug: "falcon-focus",
  owner: "falconkom",
  scheme: "falcon-focus",
  version: "1.0.0",
});
