# Factory walkthrough

Use the isolated synthetic demo factory. Follow the root README to seed it and sign in on the phone.

1. As admin, create a material grade with zero stock. Receive 10 whole units and record the supplier delivery reference.
2. Place a buyer order for 3 units. The available stock should now read 7. Open the movement history to see the receipt and reservation.
3. As staff, open the order, check its grade and quantity, mark it packed and record dispatch. The available balance stays at 7 because the reservation was recorded at order creation.
4. As admin, place a second order for 2 units, then cancel it. Verify the balance returns from 5 to 7 and that the ledger shows one release.
5. Inspect the admin report for the period. The cancelled order is excluded from sales. Staff order details omit prices and buyer phone numbers.
