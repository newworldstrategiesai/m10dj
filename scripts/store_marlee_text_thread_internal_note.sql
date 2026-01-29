-- Store Marlee text thread as internal note on invoice bdcda9ea.
-- Run in Supabase SQL Editor. Uses dollar quoting so single quotes in text are safe.

UPDATE invoices
SET
  internal_notes = $thread$
Marlee:
Hey, I got your number from Tay who had the Photo Booth at last night's wedding. I was reaching out to see if I could get more information for my wedding on 10/10/26 at Pin Oak which is now called The Elliot. 🙂
My name is Marlee by the way.

Ben Murray:
Hi Marlee! Would love to get quote to you. What's your email address?

Marlee:
mecordo@yahoo.com

Ben Murray:
I sent you an email. Would love to have a phone call with you and talk about it! Whenever works best for you

Marlee:
Yes that would be perfect! Im home with my two littles today I could talk when my youngest goes down for a nap.

Ben Murray:
Great. When is nap time?

Marlee:
He never did. 😭 it's been a day. Are you able to talk on weekends?

Ben Murray:
Oh no 😬 yeah we can find some time during the weekend that's no problem

Marlee:
Hey! I'm sorry I've been super busy and totally forgot to reach back out. I had a question regarding the packages. I like package 2 however we won't need the monogram projection. Is there any way to remove that feature?

Ben Murray:
Hey! No problem at all I know how it goes. We can remove the monogram projection.  that's no problem

Marlee:
We'd like to go with that then. Package 2 without the monogram projection. 🙂

Ben Murray:
Perfect! Package 2 without the monogram projection sounds great. I'll take that off and get you the updated quote.

Marlee:
Thank you so much.
Hey just a heads up the quote has 10/9 instead of 10/10 as the date. Also, do we have to keep the extra hour or is there any way to remove that?

Ben Murray:
Thanks for catching that date! I'll get that fixed to 10/10 right away.

About the extra hour - I should mention, we're actually in the process of updating our website and packages. The monogram projection wasn't originally supposed to be part of Package 2 - it was temporarily added while we updated our pricing. So removing it was actually correcting the package structure. The extra hour is what should have been there all along and is a core part of Package 2.

So Package 2 without the monogram would be $2,150 (Package 2 is $2,500, monogram a la carte is $350, so $2,500 - $350 = $2,150). Here's what Package 2 includes:
> - 6 hours of DJ/MC services (ceremony + cocktail hour + reception)
> - Ceremony audio (ceremony music + microphones)
> - Cocktail hour music & DJ services
> - Dance floor lighting
> - Uplighting (16 multicolor LED fixtures)
> - Additional speaker (perfect for ceremony/cocktail hour separation)
> - Seamless flow from ceremony to cocktail hour to reception

Marlee:
That's perfect! It just was showing it still on the package and wanted to clarify.
How much is required for retainer?

Ben Murray:
Awesome. It's 50% reserve your date

Marlee:
Okie dokie. Are you working on sending new invoice that way I can book?

Ben Murray:
Yes ma'm. I'll have that right over to you in just a few moments
Here you go. It'ss easy to view the invoice, make a payment, review and sign the contract, etc.Let me know if you have any issues!
https://www.m10djcompany.com/quote/c082f6bd-d63c-4c23-992d-caa68c299017/invoice

Marlee:
The address to the venue is incorrect just a heads up. It should be:

10720 SR-76
Somerville, TN  38068
United States
Should I go ahead with contract still or wait for you to change that?

Ben Murray:
I can go ahead and change that right now one moment.
Done! ✅

Marlee:
Just missing the 1 at the beginning.

Ben Murray:
Wowww. My bad
Fixed

Marlee:
Just sent deposit.

Ben Murray:
Awesome! Just saw it come through. Thank you so much. I'll be sending you a questionnaire in a bit that helps plan your song requests for special dances, bridal march, etc. But no pressure, we have plenty of time to get that worked out!

Marlee:
Okie dokie perfect! Yay I'm excited.
$thread$,
  updated_at = NOW()
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
