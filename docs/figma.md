# Design tokens and visual intent

No Figma file was provided or created. The web design is implemented in web/src/style.css and the mobile tokens in mobile/src/components/ui.tsx.

Typography: Inter first, system sans fallback; Georgia for editorial welcome/brief headings. Inter is not loaded from a remote font provider. Spacing follows an 8px rhythm with some 4px subdivisions. Ink #1B3A4B; amber #E8A838; paper #F6F4EF. Amber buttons/text are paired with dark ink or darker brown for contrast. Success/warning/danger always have text labels.

The owner desk uses a persistent sidebar, calm top bar, four summary cards, sales chart, low-stock list and top products. Main operations stay one click away. On narrow screens navigation becomes a horizontal row and forms stack. Native mobile focuses on a large pick list and minimum 50px action targets. No decorative image generation or external imagery is needed.

Human QA still required: authenticated dashboard keyboard flow, modal focus restoration, 200% zoom, Android TalkBack and real small-device packing. Login and privacy navigation were inspected in a real browser, including a 390px viewport. No certification is implied.
