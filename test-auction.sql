-- ============================================================
-- STRAITS AQUATICS TEST AUCTION
-- Run this ONLY after the main auction schema has been installed.
--
-- It creates one public test auction that starts immediately
-- and ends 30 minutes after this query is run.
--
-- Delete it afterwards with the cleanup query at the bottom.
-- ============================================================

with new_auction as (
  insert into public.auctions (
    slug,
    title,
    description,
    category,
    status,
    currency,
    starting_bid,
    min_increment,
    buy_now_price,
    starts_at,
    ends_at,
    anti_snipe_enabled,
    anti_snipe_window_seconds,
    anti_snipe_extension_seconds,
    collection_enabled,
    local_delivery_enabled,
    local_delivery_price_gbp,
    iberia_shipping_enabled,
    iberia_shipping_price_eur,
    terms,
    published_at
  )
  values (
    'test-auction-' || floor(extract(epoch from now()))::text,
    'TEST AUCTION — DO NOT BID',
    'This is a temporary auction used to test registration, bidding, Realtime updates, anti-sniping and the winner workflow.',
    'System Test',
    'live',
    'GBP',
    10.00,
    2.00,
    30.00,
    now() - interval '1 minute',
    now() + interval '30 minutes',
    true,
    120,
    120,
    true,
    true,
    7.50,
    true,
    18.00,
    'TEST ONLY. No real purchase obligation.',
    now()
  )
  returning id
)
insert into public.auction_admin_details (
  auction_id,
  reserve_price,
  internal_notes
)
select
  id,
  20.00,
  'Temporary system test auction.'
from new_auction
returning auction_id;

-- Confirm the auction:
select
  id,
  title,
  status,
  starting_bid,
  min_increment,
  buy_now_price,
  starts_at,
  ends_at,
  has_reserve,
  reserve_met,
  published_at
from public.auctions
where title = 'TEST AUCTION — DO NOT BID'
order by created_at desc
limit 1;

-- ------------------------------------------------------------
-- CLEANUP AFTER TESTING
-- Uncomment and run when you want to remove all test auctions.
-- ------------------------------------------------------------

-- delete from public.auctions
-- where title = 'TEST AUCTION — DO NOT BID';
