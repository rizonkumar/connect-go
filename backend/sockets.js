const onlineDrivers = new Map();
const Ride = require("./models/ride.model");
const Captain = require("./models/captain.model");
const mapService = require("./services/map.service");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Captain/Driver comes online
    socket.on("captain:online", async (captainData) => {
      try {
        console.log("Captain came online:", captainData);

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
        const { rideId, captainId } = data;

        // Find the ride and calculate duration
        const ride = await Ride.findById(rideId);
        if (!ride) {
          socket.emit("ride:error", { message: "Ride not found" });
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
          },
          { new: true }
        ).populate("captain");

        if (!updatedRide) {
          socket.emit("ride:error", { message: "Failed to update ride" });
          return;
        }

        // Notify the user
        io.to(ride.user.toString()).emit("ride:accepted", {
          rideId: updatedRide._id,
          captain: {
            id: updatedRide.captain._id,
            name: `${updatedRide.captain.fullName.firstName} ${updatedRide.captain.fullName.lastName}`,
            vehicle: updatedRide.captain.vehicle,
          },
          fare: updatedRide.fare,
          duration: distanceTime.durationInMinutes,
          durationText: distanceTime.durationText,
          status: updatedRide.status,
          otp: updatedRide.otp,
        });

        // Notify other drivers
        socket.broadcast.emit("ride:unavailable", rideId);
      } catch (error) {
        console.error("Error accepting ride:", error);
        socket.emit("ride:error", { message: error.message });
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

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        // Find and update captain status if it was a captain socket
        for (const [captainId, data] of onlineDrivers.entries()) {
          if (data.socketId === socket.id) {
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
