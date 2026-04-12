# Personal Habit Consistency Tracker — Product Spec Draft

## 1. Product Summary

A personal habit and consistency tracker focused on **fast daily logging**, **clear week/month visibility**, **lightweight reflection**, and **self-defined milestones/rewards**.

This is not intended to be a generic social habit app or a gamified productivity system. It is a personal product designed to help answer a simple question:

**Am I becoming more consistent in the areas of life I care about?**

The product should make it extremely easy to log behavior each day, then make it easy to review whether overall direction is improving over time.

---

## 2. Product Vision

Build a habit tracking product that:

* makes logging feel frictionless
* supports both binary and quantity-based habits
* resets cleanly each day while preserving historical accumulation underneath
* allows lightweight context through tags and short notes
* shows whether daily targets were met
* helps identify positive and negative trends over time
* supports self-defined streak rewards and milestones
* never introduces shame into the user experience

This product should feel like a hybrid of:

* a **daily tracker**
* a **light personal journal**
* a **trend dashboard**

But the center of gravity is daily tracking, not analysis.

---

## 3. Product Principles

### 3.1 Logging first

The most frequent action in the product is logging today’s habits.

The main interaction should be possible in seconds:

* tap to increment a counter
* tap to decrement if needed
* tap to mark a binary habit complete
* optionally attach a tag or short note

### 3.2 Neutral, not punishing

If a day ends with no entry, the product should treat that as missed or incomplete in the data model, but the UI language should remain neutral.

Avoid shame-based language, alarming colors, or punitive framing.

### 3.3 User-owned success

Success is defined by the user’s target for each habit.

Examples:

* water success = at least target amount reached
* alcohol success = at or below allowed target
* climbing success = completed
* piano success = completed

The app should evaluate success automatically once rules are configured.

### 3.4 Flexible habit types, simple interaction model

Different habits behave differently, but should feel consistent to use.

The product must support at least:

* binary completion habits
* counter-based quantity habits
* future support for duration-based habits

### 3.5 Reflection is lightweight

Freeform journaling matters, but it is secondary.

Reflection in V1/V1.5 should be intentionally small:

* short daily note
* optional tags
* optional habit-specific tags

### 3.6 Trends over guilt

The dashboard exists to answer:

* am I trending in the right direction?
* what am I consistent at?
* what am I neglecting?
* how did this week/month go?

It is not there to scold the user.

---

## 4. Target User

### Primary user

The product is currently for one user only: the creator.

### User profile

A person who wants:

* more consistency in daily routines
* better visibility into health and discipline patterns
* a very fast way to track daily behavior
* the ability to attach context to good/bad days
* week/month recap views instead of only streak-based views

### Core emotional need

The user wants evidence of improvement and clarity, not guilt.

---

## 5. Problem Statement

Existing habit apps do not fit the need well because they tend to be either:

* paywalled
* overly simplistic checkbox trackers
* too generic in their data model
* not supportive of increment-based tracking
* weak at attaching context, milestones, or personal rewards

The user wants a product that supports:

* counters for things like water and alcohol
* binary habits for things like climbing and cooking
* targets and success evaluation
* tags/notes to explain outcomes
* recap dashboards over time
* self-defined rewards linked to streaks or consistency

---

## 6. Primary Use Cases

### 6.1 Daily logging

When opening the app, the first screen should show today’s habits and allow quick interaction.

Examples:

* `+1 water`
* `+1 alcohol`
* mark climbing complete
* mark cooking complete
* mark programming complete
* mark piano complete

### 6.2 Daily reset

Each new day should begin as a fresh tracking surface for the already configured habits.

The prior day remains in history, but the current day starts clean.

### 6.3 Success evaluation

The product should compare today’s logged values against configured targets and indicate whether the habit is currently on track, complete, incomplete, skipped, or missed.

### 6.4 Light reflection

The user should be able to add:

* short daily note
* day-level tags
* optional habit-level tags

Examples:

* `stress`
* `social`
* `travel`
* `good-routine`
* `late-work`

### 6.5 Review and recap

The user should be able to view:

* this week summary
* this month summary
* habit-by-habit consistency
* successful days vs missed days
* count totals for counter habits
* streaks where relevant
* milestones achieved

### 6.6 Rewards and milestones

The user should be able to define rewards tied to streaks or success patterns.

Example:

* “After 8 consecutive successful cooking days, buy a blender.”

---

## 7. Core Habit Types

### 7.1 Binary habit

User either completed the habit that day or did not.

Examples:

* climbing
* cooking
* programming
* piano

### 7.2 Counter habit

User increments or decrements a number throughout the day.

Examples:

* water intake
* alcohol intake

Each counter habit has a user-defined unit.

Examples:

* glass
* bottle
* drink
* unit

### 7.3 Duration habit (future-ready)

User records a duration amount.

Possible future examples:

* sleep
* study minutes
* practice time

This does not need to be fully built first, but the product model should leave room for it.

---

## 8. Initial V1 Habits

These are the first real habits to support, but the product should be designed generally enough to support future habits without redesign.

### 8.1 Alcohol

* Type: counter
* Unit: user-defined, likely `drink` or `unit`
* Purpose: monitor frequency and amount
* Success: user-defined target, likely “at or below X”

### 8.2 Water intake

* Type: counter
* Unit: user-defined, likely `glass`
* Purpose: monitor hydration consistency
* Success: user-defined target, likely “at least X”

### 8.3 Climbing

* Type: binary
* Purpose: record whether activity happened that day
* Success: completed

### 8.4 Cooking

* Type: binary
* Purpose: record whether food was cooked at home
* Success: completed

### 8.5 Programming

* Type: binary
* Purpose: record whether meaningful programming/software engineering work happened that day
* Success: completed

### 8.6 Piano

* Type: binary
* Purpose: record whether piano practice happened that day
* Success: completed

---

## 9. Core Product Objects

### 9.1 Habit

A trackable item created by the user.

Suggested fields:

* id
* name
* type (`binary`, `counter`, later `duration`)
* unit (optional)
* target type (`at_least`, `at_most`, `exact`, `complete`)
* daily target value (optional for binary)
* active/inactive status
* display order
* color/icon (optional later)

### 9.2 Habit Log

A record of a habit on a particular day.

Suggested fields:

* id
* habit_id
* date
* value
* success status
* completion timestamp(s) optional later
* habit-level tags optional
* habit-level note optional later

### 9.3 Day Entry

A date-level container that groups all logs for a day.

Suggested fields:

* date
* daily note
* day tags
* derived completion summary

### 9.4 Tag

Reusable label for context.

May exist at:

* day level
* habit-log level

### 9.5 Milestone

A meaningful achievement event.

Examples:

* 8 consecutive successful cooking days
* 14 successful water days in a month
* 20 climbing completions total

### 9.6 Reward

A user-authored reward linked to a condition.

Examples:

* after 8 successful days in a row
* after 20 total completions
* after 4 weeks of consistency above threshold

---

## 10. Success Model

Success should be configurable per habit.

### Example target rules

* Water: success when value >= target
* Alcohol: success when value <= target
* Climbing: success when completed = true
* Cooking: success when completed = true

This distinction is important because some habits are positive accumulation and others are bounded consumption.

The UI should make success visible, but without turning missed days into shame events.

### Daily state model

A day should support distinct tracking states.

Suggested states:

* **successful** — target met / habit completed according to its rule
* **incomplete** — habit was logged but target not met
* **skipped** — user intentionally marked the habit as skipped for that day
* **missed** — no tracking action was taken for that habit that day

Important product interpretation:

* **skipped** and **missed** are different behavioral signals
* both may count as non-success for targets/streak logic, depending on future rule design
* **skipped** means the user actively engaged with the app and recorded an intentional off-day
* **missed** means the user did not log the habit at all

This matters because the product should be able to distinguish:

* failure to do the habit
* intentional non-participation
* failure to open the app

The UI should keep both states neutral, but analytics and history should preserve the difference.

## 11. Primary Screens

## 11.1 Tracking screen (default home)

This is the most important screen.

Purpose:

* show all active habits for today
* make logging fast
* show current progress toward target
* allow optional note/tag attachment

For each habit, likely UI needs:

* habit name
* current value or completion state
* target
* quick actions
* current success indicator
* optional tag/note entry affordance

Examples:

* Water: `3 / 8 glasses` with `+` and `-`
* Alcohol: `1 / max 0 drinks` with `+` and `-`
* Climbing: unchecked / checked
* Cooking: unchecked / checked

### Desired interaction qualities

* minimal taps
* visually calm
* obvious state
* easy to review entire day at once

## 11.2 Dashboard screen

Purpose:

* review trends
* see consistency
* compare this week/month
* identify drift
* highlight milestones/rewards

Initial questions the dashboard should answer:

* how many successful habit-days this week?
* how many this month?
* which habits are trending better or worse?
* what has been missed most?
* what milestones have been achieved recently?

## 11.3 Reflection/history screen

Purpose:

* review prior days
* see notes and tags
* inspect patterns

Could include:

* calendar/list of past days
* day notes
* tag filters
* habit history

## 11.4 Habit setup/edit screen

Purpose:

* create new habit
* choose type
* choose unit
* define target
* define success rule
* enable/disable habit

## 11.5 Rewards/milestones screen

Purpose:

* create self-defined rewards
* attach them to streaks or milestones
* review what has been unlocked or is in progress

---

## 12. Dashboard Metrics (Initial)

For **this week** and **this month**, the product should eventually support:

* number of successful days per habit
* number of missed/incomplete days per habit
* total quantity for counter habits
* average quantity for counter habits
* streaks (current / best)
* number of active habits completed today
* recently tagged days
* recent milestones reached

Examples:

* Water target met 4/7 days this week
* Alcohol target met 6/7 days this week
* Cooking completed 9 times this month
* Piano completed 3 times this week

---

## 13. Reflection Model

Reflection should remain lightweight.

### Day-level reflection

Supported in the near term:

* one short freeform note per day
* multiple day-level tags

### Habit-level reflection

Desired:

* optional tag attached to a specific habit log
* explain why a specific habit succeeded or failed

Example:

* alcohol → tag: `social`
* programming → tag: `low-energy`
* climbing → tag: `great-session`

This may come after the core tracking loop is stable.

---

## 14. Rewards and Milestones

The product should support self-authored motivation, not system-imposed gamification.

### Reward examples

* After 8 consecutive successful cooking days, buy a blender
* After 20 piano days, buy new sheet music
* After 14 low-alcohol days, take yourself out for a good meal

### Milestone types to support over time

* consecutive successful days
* total successful days
* total completions
* total quantity accumulated
* custom threshold reached

### Important principle

Rewards should feel optional and personal, never infantilizing.

---

## 15. Platform Thinking

## 15.1 Mobile

Likely best for:

* fast logging
* quick check-in during the day
* adding notes/tags in the moment

## 15.2 Web

Likely best for:

* habit setup
* editing rules and targets
* dashboard review
* history inspection
* managing rewards/milestones

The product should be designed with mobile-first logging in mind, even if web is built first.

---

## 16. Non-Goals (for now)

The product is not initially trying to be:

* a social app
* a public accountability app
* a task manager replacement
* a calendar replacement
* an AI coach
* a full journal product
* a general life operating system
* a heavy gamification product

These can be revisited later, but they should not influence the first product scope.

---

## 17. Risks to Avoid

### 17.1 Overbuilding before usage

There is a risk of designing too many systems before confirming that daily tracking becomes habitual.

### 17.2 Too much friction on the main screen

If logging is not immediate, the product fails its main job.

### 17.3 Too many feature layers

Tags, notes, milestones, rewards, analytics, and habit types can overwhelm the interaction model if all surfaced equally.

### 17.4 Misinterpreting missing data

The product should distinguish conceptually between:

* no interaction happened (`missed`)
* target not met after logging (`incomplete`)
* habit intentionally skipped (`skipped`)
* target successfully met (`successful`)

This distinction is important because skipped days still represent engagement with the product, while missed days represent logging failure or absence.

The UI should remain simple and neutral, even though the underlying state model is richer.

---

## 18. Product Success Criteria

The product is successful if:

* the user actually logs habits daily
* logging feels easy enough to use repeatedly
* week/month recap provides useful insight
* the dashboard makes direction visible
* tags/notes help explain patterns
* rewards/milestones add motivation without clutter

A useful internal benchmark:

> If this product becomes the default place the user opens to understand how they’ve been doing lately, it is working.

---

## 19. Open Product Questions

These are the main questions still worth resolving before implementation planning:

1. Should habit-level tags exist in V1 or later?
2. Should binary habits support partial credit later?
3. Should targets be daily only, or also weekly?
4. Should skipped count differently from missed in streak logic, analytics, or rewards?
5. Should counters support preset increment sizes beyond `+1`?
6. Should editing a habit preserve old historical meaning if rules change?
7. Should streaks be based on logging, success, or completion?
8. How much dashboard customization should be supported later?

## 20. Proposed Product Direction

### V1 philosophy

Build the smallest version that proves the daily loop:

* create habits
* log habits quickly each day
* reset each day
* review this week / this month
* see whether targets were met

### Long-term vision

Evolve into a more complete personal consistency platform with:

* day and habit tags
* short notes
* milestones and rewards
* richer history and filtering
* deeper dashboard analytics
* more habit types and more expressive goals

---

## 21. One-Sentence Product Definition

A personal consistency tracker that makes daily habit logging fast, supports both counters and binary habits, and helps the user understand long-term progress through neutral recaps, lightweight reflection, and self-defined milestones.


## 22 MINIMUM VIABLE PRODUCT (to build first)
The MVP should be a minimal cross-platform habit tracker, available on both web and mobile, 
that lets the user create and manage habits, supports both binary and counter-based tracking
with user-defined units and daily targets, provides a fast “Today” logging screen for marking habits complete,
incrementing counters, or skipping them, automatically resets each day while preserving history,
syncs all data through a shared backend/database, and includes a simple week/month recap showing progress,
success, missed/skipped states, and basic consistency trends.
