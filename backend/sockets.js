const onlineDrivers = new Map();
const Ride = require("./models/ride.model");
const Captain = require("./models/captain.model");
const CaptainSession = require("./models/captainSession.model");
const User = require("./models/user.model");
const mapService = require("./services/map.service");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Handle joining user room
    socket.on("join:user", async (userData) => {
      try {
        console.log("User joining room:", userData);
        await User.findByIdAndUpdate(userData.userId, { socketId: socket.id });
        socket.join(userData.userId);
      } catch (error) {
        console.error("Error joining user room:", error);
      }
    });

    // Captain comes online
    socket.on("captain:online", async (captainData) => {
      try {
        console.log("Captain came online:", captainData);

        // Create new session record
        await CaptainSession.create({
          captain: captainData.id,
          loginTime: new Date(),
          isActive: true,
        });

        // Update captain's socket ID and status
        await Captain.findByIdAndUpdate(captainData.id, {
          socketId: socket.id,
          status: "active",
          "location.lat": captainData.location?.lat,
          "location.lng": captainData.location?.lng,
        });

        // Store captain data in memory
        onlineDrivers.set(captainData.id, {
          socketId: socket.id,
          ...captainData,
        });

        // Join captain room
        socket.join(captainData.id);

        // Broadcast updated driver count
        io.emit("drivers:count", onlineDrivers.size);
      } catch (error) {
        console.error("Error handling captain online:", error);
        socket.emit("captain:error", { message: "Failed to go online" });
      }
    });

    // Captain goes offline
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

        // Update captain status
        await Captain.findByIdAndUpdate(captainId, {
          socketId: null,
          status: "inactive",
        });

        // Remove from online drivers
        onlineDrivers.delete(captainId);
        socket.leave(captainId);

        io.emit("drivers:count", onlineDrivers.size);
      } catch (error) {
        console.error("Error handling captain offline:", error);
      }
    });

    // Handle ride acceptance
    socket.on("ride:accept", async (data) => {
      try {
        console.log("Captain accepting ride:", data);
        const { rideId, captainId, userId } = data;

        // Find the ride
        const ride = await Ride.findById(rideId).populate("user");
        if (!ride) {
          socket.emit("ride:error", { message: "Ride not found" });
          return;
        }

        // Get user socket
        const user = await User.findById(userId);
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
            distance: distanceTime.distanceInKm,
          },
          { new: true }
        ).populate("captain");

        // Prepare acceptance data
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
          distance: `${distanceTime.distanceInKm} km`,
          status: "accepted",
          otp: updatedRide.otp,
        };

        // Emit to user
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

    // Handle ride start
    socket.on("ride:start", async (data) => {
      try {
        const { rideId, otp } = data;

        const ride = await Ride.findById(rideId);
        if (!ride) {
          socket.emit("ride:error", { message: "Ride not found" });
          return;
        }

        if (ride.otp !== otp) {
          socket.emit("ride:error", { message: "Invalid OTP" });
          return;
        }

        ride.status = "ongoing";
        await ride.save();

        // Notify both parties
        io.to(ride.user.toString()).emit("ride:started", { rideId });
        io.to(ride.captain.toString()).emit("ride:started", { rideId });
      } catch (error) {
        console.error("Error starting ride:", error);
        socket.emit("ride:error", { message: "Failed to start ride" });
      }
    });

    // Handle ride completion
    socket.on("ride:complete", async (rideId) => {
      try {
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: "completed" },
          { new: true }
        );

        if (ride) {
          const completionData = {
            rideId,
            fare: ride.fare,
            distance: ride.distance,
            duration: ride.duration,
          };

          // Notify both parties
          io.to(ride.user.toString()).emit("ride:completed", completionData);
          io.to(ride.captain.toString()).emit("ride:completed", completionData);
        }
      } catch (error) {
        console.error("Error completing ride:", error);
        socket.emit("ride:error", { message: "Failed to complete ride" });
      }
    });

    // Handle ride cancellation
    socket.on("ride:cancel", async (rideId) => {
      try {
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          { status: "cancelled" },
          { new: true }
        );

        if (ride) {
          // Notify both parties
          io.to(ride.user.toString()).emit("ride:cancelled", { rideId });
          if (ride.captain) {
            io.to(ride.captain.toString()).emit("ride:cancelled", { rideId });
          }
        }
      } catch (error) {
        console.error("Error cancelling ride:", error);
        socket.emit("ride:error", { message: "Failed to cancel ride" });
      }
    });

    // Handle location updates
    socket.on("captain:location_update", async (data) => {
      try {
        const { captainId, location, rideId } = data;

        // Update captain's location
        await Captain.findByIdAndUpdate(captainId, {
          location: {
            lat: location.latitude,
            lng: location.longitude,
          },
        });

        // If active ride, notify user
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
        console.error("Error updating location:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        console.log("Client disconnected:", socket.id);

        // Check if it was a captain
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

            // Update captain status
            await Captain.findByIdAndUpdate(captainId, {
              socketId: null,
              status: "inactive",
            });

            onlineDrivers.delete(captainId);
            io.emit("drivers:count", onlineDrivers.size);
            break;
          }
        }

        // Check if it was a user
        await User.updateMany(
          { socketId: socket.id },
          { $unset: { socketId: 1 } }
        );
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });
};
