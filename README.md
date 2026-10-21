# Brew And Branch Bookings

Build a sleek, highly polished, and unique scheduling web app called "CoffeeChat & Code Review with [Your Name]". Make the UI modern, engaging, and distinct—use dark mode with glowing neon accents, clean glassmorphism cards, smooth framer-motion-style transitions, and a creative theme (e.g., a dev mentorship booking platform rather than a boring corporate calendar).

The app must have two seamless tabs or views:

1. HOST VIEW:

   - Form to create available time slots with inputs for: date (YYYY-MM-DD), start time (HH:MM), and duration in minutes (number).

   - A list view of all created slots showing whether they are available or already booked.

2. GUEST VIEW:

   - A clean grid/list showing only available, unbooked time slots.

   - A booking modal that opens when a guest clicks "Book Slot", capturing their guestName (string) and guestEmail (string).

   - Upon successful booking, display a delightful confirmation screen showing an AI-generated friendly confirmation message returned by the backend.

Technical & Integration Requirements:

- Use React, TypeScript, and Tailwind CSS.

- The app must connect to an external NestJS backend API running at `http://localhost:3000/api`.

- Set up an api service layer (using Axios or fetch) matching these exact endpoints and data types:

  * GET /api/slots -> Returns an array of TimeSlot objects: { id: string; date: string; startTime: string; duration: number; isBooked: boolean; guestName?: string; guestEmail?: string }

  * POST /api/slots -> Request body: { date: string; startTime: string; duration: number } -> Returns the created TimeSlot.

  * POST /api/slots/:id/book -> Request body: { guestName: string; guestEmail: string } -> Returns the updated TimeSlot and an aiConfirmationMessage (string).

- Handle loading states, error boundaries, and empty states gracefully with beautiful Tailwind skeletons/illustrations.

This project was built with [Lovable](https://lovable.dev).

## What I Would Improve With More Time

- **Cancellation & Rescheduling Workflows:** Implement automated email notifications (via Resend) when a host cancels a session, giving guests a seamless one-click link to pick an alternative slot.
- **Google Calendar Integration:** Sync confirmed bookings directly to the host's Google Calendar and auto-hide conflicting slots.
- **Multi-Host Authentication:** Add secure user accounts so multiple hosts can claim custom booking profile URLs.
- **Time Zone Support:** Dynamic client-side time zone conversion for guests booking across different regions.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/748abdce-4505-46db-8754-f269eaf82fad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
