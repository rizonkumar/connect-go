TODO:

1. after creating a ride we need to send a request to the driver to acceept the ride or reject the ride, if one of the driver accepts the ride then automalloty for other driver the notification/message should not be sent.

2. Capatin Context API data should be visible in the UI once the rider is logged in currenltu we are using dummy data for the capatin context API.

Live tracking of the ride should be visible in the UI.

Driver Got a request to accept or reject the ride. but after accepting the ride the page become blank.

For the User Side still it's searching which shouls not be the case right?

the response i got
{
"status": "success",
"message": "Ride created successfully",
"data": {
"ride": {
"user": "6747ec17be7778f08f11aca5",
"pickup": "Cmatrix Learning, behind Doctor Tonpe Road, CDA Sector 8, Cuttack, Odisha, India",
"destination": "Bhubaneswar Airport, Airport Road, Aerodrome Area, Bhubaneswar, Odisha, India",
"fare": 648,
"status": "pending",
"otp": "9762",
"\_id": "676305903c24700d1919db9e",
"\_\_v": 0
}
}
