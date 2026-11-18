# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary: the owner.** Uses it as a personal tool to track their own part-time income.
- **Equally important: portfolio visitors.** People who open the public demo build to judge the owner's product and engineering work.

The main usage scene is **quickly logging on a phone right after a shift** (hours, piece counts, or a fixed amount).

## Product Purpose
Tracks income from several part-time jobs at once. Each job uses one pay method: hourly (HOURLY), per piece (PIECE), or a fixed amount (FIXED). The unit price can be adjusted week by week (weekly prices), and each log keeps the unit price it used. Results are shown in a weekly sheet and a monthly report, and can be exported. Success means a log takes only a few seconds on a phone, and the weekly and monthly totals are accurate and trustworthy.

## Positioning
A salary tracker built for the real situation of Taiwanese part-time workers: several jobs, mixed pay methods, and unit prices that change from week to week. It is not a general-purpose ledger.

## Operating Context
- The personal version is locked behind a single secret key (UnlockGate). Data lives in a Cloudflare Worker + D1 backend.
- The demo build (`npm run build:demo`) runs entirely in the browser. It uses seed data and localStorage, makes no API requests, and lets visitors reset the data.

## Capabilities and Constraints
- Job management (name, pay method, base unit price, color), work logs, weekly prices, weekly sheet, monthly report, and export.
- Stack: Vite + React + Tailwind v4. Backend is a Cloudflare Worker (Hono) + D1.

## Brand Commitments
- The UI is **Traditional Chinese (zh-TW) only**, with no other language version.
- **Each job keeps its own color** as its identity, used consistently everywhere.
- All amounts are in **New Taiwan dollars (NT$)**.

## Evidence on Hand
- Demo seed data: `src/services/seedData.ts` (sample jobs such as handing out flyers and on-site coaching). It is sample data only and must not be presented as real usage statistics.
- There are no real user testimonials or usage numbers. Do not invent any.

## Product Principles
1. Phone logging comes first: the most common action takes the fewest steps.
2. Numbers must be trustworthy: the unit price used and how a total was calculated stay traceable.
3. One tool serves two audiences: the demo has to show the product's value clearly while staying identical to the real tool.
