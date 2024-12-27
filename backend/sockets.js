const onlineDrivers = new Map();
const Ride = require("./models/ride.model");
const Captain = require("./models/captain.model");
const CaptainSession = require("./models/captainSession.model");
const mapService = require("./services/map.service");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Captain/Driver comes online
    socket.on("captain:online", async (captainData) => {
      try {
        console.log("Captain came online:", captainData);

        // Create new session record
        await CaptainSession.create({
          captain: captainData.id,
          loginTime: new Date(),
          isActive: true,
        });

        // Update captain's socket ID in database
        await Captain.findByIdAndUpdate(captainData.id, {
          socketId: socket.id,
          status: "active",
        });

        onlineDrivers.set(captainData.id, {
          socketId: socket.id,
          ...captainData,
        });

        io.emit("drivers:count", onlineDrivers.size);
      } catch (error) {
        console.error("Error handling captain online:", error);
      }
    });

    // Captain/Driver goes offline
    socket.on("captain:offline", async (captainId) => {
      try {
        console.log("Captain went offline:", captainId);

        // End active session
        const activeSession = await CaptainSession.findOne({
          captain: captainId,
          isActive: true,
        });

        if (activeSession) {
          const logoutTime = new Date();
          const durationMinutes = Math.round(
            (logoutTime - activeSession.loginTime) / (1000 * 60)
          );

          activeSession.logoutTime = logoutTime;
          activeSession.isActive = false;
          activeSession.duration = durationMinutes;
          await activeSession.save();
        }

        await Captain.findByIdAndUpdate(captainId, {
          socketId: null,
          status: "inactive",
        });

        onlineDrivers.delete(captainId);
        io.emit("drivers:count", onlineDrivers.size);
      } catch (error) {
        console.error("Error handling captain offline:", error);
      }
    });

    // Captain accepts ride
    socket.on("ride:accept", async (data) => {
      try {
        console.log("Captain accepting ride:", data);
        const { rideId, captainId } = data;

        // Find the ride and calculate duration
        const ride = await Ride.findById(rideId);
        if (!ride) {
          socket.emit("ride:error", { message: "Ride not found" });
          return;
        }

        if (ride.status !== "pending") {
          socket.emit("ride:error", { message: "Ride is no longer available" });
          return;
        }

        // Calculate distance and duration
        const distanceTime = await mapService.getDistanceTime(
          ride.pickup,
          ride.destination
        );

        // Update ride with captain and duration
        const updatedRide = await Ride.findByIdAndUpdate(
          rideId,
          {
            status: "accepted",
            captain: captainId,
            duration: distanceTime.durationInMinutes,
            durationText: distanceTime.durationText,
            distance: distanceTime.distance || 0,
          },
          { new: true }
        ).populate("captain");

        if (!updatedRide) {
          socket.emit("ride:error", { message: "Failed to update ride" });
          return;
        }

        // Notify the user with complete ride details
        io.to(ride.user.toString()).emit("ride:accepted", {
          rideId: updatedRide._id,
          captain: {
            id: updatedRide.captain._id,
            name: `${updatedRide.captain.fullName.firstName} ${updatedRide.captain.fullName.lastName}`,
            vehicle: updatedRide.captain.vehicle,
            phone: updatedRide.captain.phone,
            rating: updatedRide.captain.rating || 4.5,
          },
          fare: updatedRide.fare,
          duration: distanceTime.durationInMinutes,
          durationText: distanceTime.durationText,
          distance: distanceTime.distance,
          status: updatedRide.status,
          otp: updatedRide.otp,
        });

        // Notify other drivers that ride is no longer available
        socket.broadcast.emit("ride:unavailable", rideId);

        // Send confirmation to accepting captain
        socket.emit("ride:acceptance_confirmed", {
          rideId: updatedRide._id,
          pickup: updatedRide.pickup,
          destination: updatedRide.destination,
          fare: updatedRide.fare,
          otp: updatedRide.otp,
          duration: distanceTime.durationInMinutes,
          durationText: distanceTime.durationText,
          distance: distanceTime.distance,
          passenger: {
            id: ride.user,
            // You might want to populate user details here
          },
        });
      } catch (error) {
        console.error("Error accepting ride:", error);
        socket.emit("ride:error", { message: error.message });
      }
    });

    // Handle ride start (after OTP verification)
    socket.on("ride:start", async (rideId) => {
      try {
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: "ongoing" },
          { new: true }
        );

        if (ride) {
          io.to(ride.user.toString()).emit("ride:started", { rideId });
          io.to(ride.captain.toString()).emit("ride:started", { rideId });
        }
      } catch (error) {
        console.error("Error starting ride:", error);
      }
    });

    // Handle ride completion
    socket.on("ride:complete", async (rideId) => {
      try {
        if (!rideId) return;

        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: "completed" },
          { new: true }
        );

        if (ride) {
          // Notify relevant parties about completion
          io.to(ride.user.toString()).emit("ride:completed", {
            rideId,
            fare: ride.fare,
            distance: ride.distance,
            duration: ride.duration,
          });

          if (ride.captain) {
            io.to(ride.captain.toString()).emit("ride:completed", {
              rideId,
              fare: ride.fare,
              distance: ride.distance,
              duration: ride.duration,
            });
          }
        }
      } catch (error) {
        console.error("Error completing ride:", error);
      }
    });

    // Handle ride cancellation
    socket.on("ride:cancel", async (rideId) => {
      try {
        if (!rideId) return;

        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: "cancelled" },
          { new: true }
        );

        if (ride) {
          // Notify relevant parties about cancellation
          io.to(ride.user.toString()).emit("ride:cancelled", { rideId });
          if (ride.captain) {
            io.to(ride.captain.toString()).emit("ride:cancelled", { rideId });
          }
        }
      } catch (error) {
        console.error("Error cancelling ride:", error);
      }
    });

    // Handle captain location updates
    socket.on("captain:location_update", async (data) => {
      try {
        const { captainId, location, rideId } = data;

        // Update captain's location in database
        await Captain.findByIdAndUpdate(captainId, {
          location: {
            lat: location.latitude,
            lng: location.longitude,
          },
        });

        // If there's an active ride, emit location to user
        if (rideId) {
          const ride = await Ride.findById(rideId);
          if (ride && ride.user) {
            io.to(ride.user.toString()).emit("ride:location_update", {
              location,
              rideId,
            });
          }
        }
      } catch (error) {
        console.error("Error updating captain location:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        // Find and update captain status if it was a captain socket
        for (const [captainId, data] of onlineDrivers.entries()) {
          if (data.socketId === socket.id) {
            // End active session
            const activeSession = await CaptainSession.findOne({
              captain: captainId,
              isActive: true,
            });

            if (activeSession) {
              const logoutTime = new Date();
              const durationMinutes = Math.round(
                (logoutTime - activeSession.loginTime) / (1000 * 60)
              );

              activeSession.logoutTime = logoutTime;
              activeSession.isActive = false;
              activeSession.duration = durationMinutes;
              await activeSession.save();
            }

            await Captain.findByIdAndUpdate(captainId, {
              socketId: null,
              status: "inactive",
            });
            onlineDrivers.delete(captainId);
            io.emit("drivers:count", onlineDrivers.size);
            break;
          }
        }
        console.log("User disconnected:", socket.id);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};
