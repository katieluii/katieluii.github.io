import type { PresentationProfile } from '../presentationProfile';
import profiles from './profiles.json';

export const PROFILE_OVERRIDES = profiles as unknown as Record<string, PresentationProfile>;
