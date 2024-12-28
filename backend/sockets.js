const onlineDrivers = new Map();
const Ride = require("./models/ride.model");
const Captain = require("./models/captain.model");
const CaptainSession = require("./models/captainSession.model");
const mapService = require("./services/map.service");
const User = require("./models/user.model");

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

    socket.on("ride:accept", async (data) => {
      try {
        console.log("Captain accepting ride:", data);
        const { rideId, captainId } = data;

        // Find the ride and populate user details
        const ride = await Ride.findById(rideId).populate("user");
        if (!ride) {
          socket.emit("ride:error", { message: "Ride not found" });
          return;
        }

        // Get the user's socket ID from the database
        const user = await User.findById(ride.user);
        if (!user || !user.socketId) {
          socket.emit("ride:error", { message: "User not connected" });
          return;
        }

        // Calculate distance and time
        const distanceTime = await mapService.getDistanceTime(
          ride.pickup,
          ride.destination
        );

        // Update ride in database
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

        // Prepare ride acceptance data
        const acceptanceData = {
          rideId: updatedRide._id,
          captain: {
            id: updatedRide.captain._id,
            name: `${updatedRide.captain.fullName.firstName} ${updatedRide.captain.fullName.lastName}`,
            vehicle: updatedRide.captain.vehicle,
            phone: updatedRide.captain.phone || "",
            rating: updatedRide.captain.rating || 4.5,
          },
          fare: updatedRide.fare,
          duration: distanceTime.durationInMinutes,
          durationText: distanceTime.durationText,
          distance: distanceTime.distance,
          status: "accepted",
          otp: updatedRide.otp,
        };

        // Emit to specific user socket
        io.to(user.socketId).emit("ride:accepted", acceptanceData);

        // Notify other drivers
        socket.broadcast.emit("ride:unavailable", rideId);

        // Confirm to captain
        socket.emit("ride:acceptance_confirmed", {
          ...acceptanceData,
          pickup: updatedRide.pickup,
          destination: updatedRide.destination,
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
