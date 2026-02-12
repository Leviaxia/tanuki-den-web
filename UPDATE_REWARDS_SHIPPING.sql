-- Remove the 50% Shipping Reward (shipping_50) from rewards table
DELETE FROM public.rewards WHERE id = 'shipping_50';

-- (Optional) If we want to clean up user_rewards associated with it, cascading delete should handle it if defined, 
-- otherwise manually delete:
DELETE FROM public.user_rewards WHERE reward_id = 'shipping_50';
