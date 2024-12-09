//// LET'S BEGIN
let currentForm = "oneWay";
let distanceKm = 0;

let fromRound = "";
let toRound = "";
let departureDateRound = "";
let passengersRound = "";
let returnDateRound = "";
let oneTo = "";

//* Togglin' dropdowns
const selectButtons = document.querySelectorAll(".selectBtn");
const options = document.querySelectorAll(".option");
let zIndex = 1;

selectButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const dropdown = event.target.nextElementSibling;
    dropdown.classList.toggle("toggle");
    dropdown.style.zIndex = zIndex++;
  });
});

//* Updatin' selected option
options.forEach((option) => {
  option.addEventListener("click", (event) => {
    const dropdown = event.target.parentElement;
    dropdown.classList.remove("toggle");
    const selectButton = dropdown.previousElementSibling;
    selectButton.setAttribute("data-type", event.target.innerHTML);
    selectButton.innerHTML = event.target.innerHTML;
  });
});

//* Initializin' datepickers for departure and return dates
$(function () {
  // Initialize datepickers and set readonly
  $("#sourcedatepicker")
    .datepicker()
    .prop("readonly", true)
    .on("change", function () {
      console.log("Departure Date:", $(this).val());
    });

  $("#roundsourcedatepicker")
    .datepicker()
    .prop("readonly", true)
    .on("change", function () {
      departureDateRound = $(this).val();
      console.log("Round-Trip Departure Date:", $(this).val());
    });

  $("#returndatepicker")
    .datepicker()
    .prop("readonly", true)
    .on("change", function () {
      returnDateRound = $(this).val();
      console.log("Return Date:", $(this).val());
    });
});

//* Togglin' between one-way and round-trip forms and clear fields
const oneWayForm = document.querySelector(".left");
const roundTripForm = document.querySelector(".round");

function toggleForms(showOneWay) {
  if (showOneWay) {
    oneWayForm.style.display = "block";
    roundTripForm.style.display = "none";
    currentForm = "oneWay";
  } else {
    roundTripForm.style.display = "block";
    oneWayForm.style.display = "none";
    currentForm = "twoWay";
  }

  revertBack();
}

document.querySelectorAll(".one-way-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleForms(true);
  });
});

document.querySelectorAll(".round-trip-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleForms(false);
  });
});

function revertBack() {
  // Reset One-Way Form
  const oneWayPickup = document.querySelector(".selectOneFrom .selectBtn");
  const oneWayDestination = document.querySelector(".selectOneTo .searchInput");
  const oneWayDate = document.getElementById("sourcedatepicker");
  const oneWayPassengers = document.querySelector(
    ".selectOneDriver .selectBtn"
  );

  oneWayPickup.innerHTML = '<i class="fas fa-map-marker-alt"></i>Pickup Point';
  oneWayPickup.setAttribute("data-type", "fromOption");
  oneWayDestination.innerHTML =
    '<i class="fas fa-map-marker-alt"></i>Select Destination';
  oneWayDestination.setAttribute("data-type", "toOption");
  oneWayDate.value = ""; // Clear date input
  oneWayPassengers.innerHTML = '<i class="fas fa-car"></i>Select Driver'; // Reset driver selection

  // Reset Round-Trip Form
  const roundTripPickup = document.querySelector(".selectRoundFrom .selectBtn");
  const roundTripDestination = document.querySelector(
    ".selectRoundTo .searchInput"
  );
  const roundTripDepartureDate = document.getElementById(
    "roundsourcedatepicker"
  );
  const roundTripReturnDate = document.getElementById("returndatepicker");
  const roundTripPassengers = document.querySelector(
    ".selectRoundDriver .selectBtn"
  );

  roundTripPickup.innerHTML =
    '<i class="fas fa-map-marker-alt"></i>Pickup Point';
  roundTripPickup.setAttribute("data-type", "fromOption");
  roundTripDestination.innerHTML =
    '<i class="fas fa-map-marker-alt"></i>Select Destination';
  roundTripDestination.setAttribute("data-type", "toOption");
  roundTripDepartureDate.value = ""; // Clear departure date input
  roundTripReturnDate.value = ""; // Clear return date input
  roundTripPassengers.innerHTML = '<i class="fas fa-car"></i>Select Driver'; // Reset driver selection
}

///// Function to handle cancel button click
function cancel() {
  document.querySelector(".receipt").style.display = "none";
  document.querySelector(".booker").style.display = "none";

  // Show the form based on the current state
  if (currentForm === "oneWay") {
    oneWayForm.style.display = "block";
  } else {
    roundTripForm.style.display = "block";
  }

  document.querySelector("h3.getquotetext").innerText = "Book a Ride";
  document.querySelector(".bookerz").style.display = "none";
}

///// Helper function to display an alert if inputs are invalid
function showError(message) {
  // Set the message in the custom alert box
  const alertBox = document.getElementById("customAlert");
  document.getElementById("alertMessage").innerText = message;

  // Show the alert with fade-in
  alertBox.classList.remove("fade-out"); // Remove fade-out if it was previously added
  alertBox.classList.add("fade-in"); // Add fade-in
  alertBox.style.display = "block"; // Make it visible

  // After 5 seconds, fade out the alert
  setTimeout(() => {
    alertBox.classList.remove("fade-in");
    alertBox.classList.add("fade-out");
  }, 5000);

  // Hide the alert after the fade-out animation completes (another 0.5s)
  setTimeout(() => {
    alertBox.style.display = "none";
  }, 7000);
}

///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// CALCULATIN, PRICE AND GENERATIN RECEIPT //////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

//* Getting current locaion

async function getUserCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve([latitude, longitude]);
        },
        (error) => reject(error)
      );
    } else {
      reject("Geolocation is not supported by this browser.");
      showError("Geolocation is not supported by this browser.");
    }
  });
}

async function setCurrentLocation(targetId = "fromOption") {
  const targetElement = document.getElementById(targetId);
  const maxRetries = 3; // Number of retries
  let attempt = 0;

  // Display a temporary loading message
  targetElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Locating...`;

  while (attempt < maxRetries) {
    try {
      // Increment the attempt count
      attempt++;

      // Use the helper function to get the user's current location
      const [latitude, longitude] = await getUserCurrentLocation();

      // Fetch the address using OpenRouteService reverse geocoding
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf62482ca5ece423c340948ce5275be634f0a8&point.lat=${latitude}&point.lon=${longitude}&size=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address data");
      }

      const data = await response.json();
      const address = data.features[0]?.properties?.label || "Unknown Location";
      fromRound = address;
      console.log(address);

      // Set the location in the target element (either fromOption or fromRoundOption)
      targetElement.setAttribute("data-text", address);
      targetElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${address}`;
      return; // Exit the function if successful
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      // If max retries are reached, show an error message
      if (attempt === maxRetries) {
        let errorMessage = "Unable to fetch location after 3 re-tries.";
        if (error.code) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by the user.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred.";
          }
        } else if (typeof error === "string") {
          errorMessage = error; // Custom error from helper function
        }

        targetElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${errorMessage}`;
        showError(errorMessage);
        return;
      }
    }
  }
}

//* Function to update available rides for round trips

let selectedOneWayRideIndex = null;
let selectedRoundTripRideIndex = null;

//* Function to update available rides based on selected locations (one-way)

async function getCoordinates(locationName) {
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf62482ca5ece423c340948ce5275be634f0a8&text=${encodeURIComponent(
        locationName
      )}&size=1`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch coordinates");
    }

    const data = await response.json();
    const coordinates = data.features[0]?.geometry?.coordinates;

    if (!coordinates) {
      throw new Error("No coordinates found for the location");
    }

    // Return coordinates as [latitude, longitude]
    return [coordinates[1], coordinates[0]];
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

async function updateAvailableRides() {
  const fromLocation = $(".selectOneFrom .selectBtn").text().trim();
  const toLocation = $(".selectOneTo .searchInput").val().trim();
  console.log(toLocation);
  const driverOptions = $("#oneWayDriverOptions");
  driverOptions.empty(); // Clear previous options

  if (
    !fromLocation ||
    !toLocation ||
    fromLocation === "Pickup Point" ||
    toLocation === "Select Destination"
  ) {
    driverOptions.append(
      "<div class='option' data-type='noOption'>Please input both pickup and destination locations. </div>"
    );
    return;
  }

  try {
    // Get coordinates for both locations
    const [fromCoords, toCoords] = await Promise.all([
      getCoordinates(fromLocation),
      getCoordinates(toLocation),
    ]);

    if (!fromCoords || !toCoords) {
      throw new Error("Unable to fetch coordinates for the locations.");
    }

    // Fetch the route details using OpenRouteService
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62482ca5ece423c340948ce5275be634f0a8&start=${fromCoords[1]},${fromCoords[0]}&end=${toCoords[1]},${toCoords[0]}`
    );
    const routeData = await response.json();

    if (!routeData.features || routeData.features.length === 0) {
      showError("Could not fetch route data.");
      throw new Error("Could not fetch route data.");
    }

    // Get distance in kilometers
    distanceKm = (
      routeData.features[0].properties.segments[0].distance / 1000
    ).toFixed(2);

    // Generate drivers with varied pricing (SUVs and Luxury Cars)
    const cars = [
      {
        name: "Moses Kamau",
        car: "Toyota Land Cruiser (SUV)",
        fare: Math.ceil(distanceKm * 8), // 10 KES per km for SUV
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Grace Otieno",
        car: "Range Rover Sport (Luxury)",
        fare: Math.ceil(distanceKm * 14), // 15 KES per km for Luxury
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Alex Mwangi",
        car: "Mazda CX-9 (SUV)",
        fare: Math.ceil(distanceKm * 5), // 9 KES per km for SUV
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Sarah Njoroge",
        car: "Mercedes-Benz S-Class (Luxury)",
        fare: Math.ceil(distanceKm * 12), // 20 KES per km for Luxury
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "John Waweru",
        car: "Ford Explorer (SUV)",
        fare: Math.ceil(distanceKm * 6), // 11 KES per km for SUV
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Jane Onyango",
        car: "Tesla Model X (Luxury)",
        fare: Math.ceil(distanceKm * 11), // 18 KES per km for Luxury
        timeAway: Math.ceil(Math.random() * 15),
      },
    ];

    // Randomly select three cars to display
    const selectedCars = cars.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Display selected cars in the HTML
    selectedCars.forEach((driver, index) => {
      driverOptions.append(
        `<div class="option fromya" 
          data-index="${index}" 
          data-car="${driver.car}" 
          data-driver="${driver.name}" 
          data-fare="${driver.fare}" 
          data-time-away="${driver.timeAway}">
      <div style="margin: 0; display: flex; align-items: center; gap: 2px;">
        <i class="fas fa-car"></i>
        ${driver.car} - Driver: ${driver.name} - Fare: Ksh ${driver.fare}
      </div>
      <p style="margin-top: 10px!important; display: flex; align-items: center; gap: 2px;">
        <i class="fas fa-clock"></i> ${driver.timeAway} minutes from you
      </p>
    </div>`
      );
    });
  } catch (error) {
    console.error("Error fetching ride details:", error);
    showError("No drivers available for this destination. Please select a different destination.");
    driverOptions.append(
      "<div class='option' data-type='noOption'>No drivers available for this destination.</div>"
    );
  }
}

/*//// GET ROUTE ON ENTER NO DEBOUNCE

// Get the input fields for destination
const destinationInput = document.querySelector(".selectOneTo .searchInput");
const destinationRoundInput = document.querySelector(
  ".selectRoundTo .searchInput"
);

// Add event listeners for the 'keydown' event on both input fields
destinationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const oneTo = destinationInput.value.trim(); // Get the value for one-way
    console.log("One-Way Destination:", oneTo);
    updateAvailableRides(); // Call the function for one-way rides
  }
});

destinationRoundInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const roundTo = destinationRoundInput.value.trim(); // Get the value for round trip
    console.log("Round Trip Destination:", roundTo);
    updateAvailableRoundRides(); // Call the function for round-trip rides
  }
});

*/

// Debounce function to delay execution
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Get the input fields for destination
const destinationInput = document.querySelector(".selectOneTo .searchInput");
const destinationRoundInput = document.querySelector(
  ".selectRoundTo .searchInput"
);

// Function to handle one-way destination input
function handleOneWayInput() {
  const oneTo = destinationInput.value.trim();
  if (oneTo) {
    console.log("One-Way Destination:", oneTo);
    updateAvailableRides(); // Call the function for one-way rides
  }
}

// Function to handle round-trip destination input
function handleRoundTripInput() {
  const roundTo = destinationRoundInput.value.trim();
  if (roundTo) {
    console.log("Round Trip Destination:", roundTo);
    updateAvailableRoundRides(); // Call the function for round-trip rides
  }
}

// Attach the debounce wrapper to input events
destinationInput.addEventListener(
  "input",
  debounce(() => handleOneWayInput(), 4000)
);
destinationRoundInput.addEventListener(
  "input",
  debounce(() => handleRoundTripInput(), 4000)
);

//* Function to update available rides for round trips
async function updateAvailableRoundRides() {
  const fromLocation = $(".selectRoundFrom .selectBtn").text().trim();
  const toLocation = $(".selectRoundTo .searchInput").val().trim();
  const driverOptions = $("#roundTripCarDriverOptions");
  driverOptions.empty(); // Clear previous options

  if (
    !fromLocation ||
    !toLocation ||
    fromLocation === "Pickup Point" ||
    toLocation === "Select Destination"
  ) {
    showError("Please select both pickup and destination locations.");
    driverOptions.append(
      "<div class='option' data-type='noOption'>Please select both pickup and destination locations.</div>"
    );
    return;
  }

  try {
    // Get coordinates for both locations (outbound and return)
    const [fromCoords, toCoords] = await Promise.all([
      getCoordinates(fromLocation),
      getCoordinates(toLocation),
    ]);

    if (!fromCoords || !toCoords) {
      throw new Error("Unable to fetch coordinates for the locations.");
    }

    // Fetch the route details for the outbound trip using OpenRouteService
    const outboundResponse = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62482ca5ece423c340948ce5275be634f0a8&start=${fromCoords[1]},${fromCoords[0]}&end=${toCoords[1]},${toCoords[0]}`
    );
    const outboundRouteData = await outboundResponse.json();

    if (
      !outboundRouteData.features ||
      outboundRouteData.features.length === 0
    ) {
      showError("Could not fetch route data.");
      throw new Error("Could not fetch route data.");
    }

    distanceKm = (
      outboundRouteData.features[0].properties.segments[0].distance / 1000
    ).toFixed(2);

    // Generate drivers with varied pricing (double the price for the round trip)
    const cars = [
      {
        name: "Moses Kamau",
        car: "Toyota Land Cruiser (SUV)",
        fare: Math.ceil(distanceKm * 8), // Double the price for round trip
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Grace Otieno",
        car: "Range Rover Sport (Luxury)",
        fare: Math.ceil(distanceKm * 14),
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Alex Mwangi",
        car: "Mazda CX-9 (SUV)",
        fare: Math.ceil(distanceKm * 5),
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Sarah Njoroge",
        car: "Mercedes-Benz S-Class (Luxury)",
        fare: Math.ceil(distanceKm * 12),
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "John Waweru",
        car: "Ford Explorer (SUV)",
        fare: Math.ceil(distanceKm * 6),
        timeAway: Math.ceil(Math.random() * 15),
      },
      {
        name: "Jane Onyango",
        car: "Tesla Model X (Luxury)",
        fare: Math.ceil(distanceKm * 11),
        timeAway: Math.ceil(Math.random() * 15),
      },
    ];

    // Randomly select three cars to display for the round trip
    const selectedCars = cars.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Display selected cars in the HTML
    selectedCars.forEach((driver, index) => {
      driverOptions.append(
        `<div class="option fromya" 
          data-index="${index}" 
          data-car="${driver.car}" 
          data-driver="${driver.name}" 
          data-fare="${driver.fare}" 
          data-time-away="${driver.timeAway}">
        <div style="margin: 0; display: flex; align-items: center; gap: 2px;">
          <i class="fas fa-car"></i>
          ${driver.car} - Driver: ${driver.name} - Fare: Ksh ${driver.fare * 2}
        </div>
        <p style="margin-top: 10px!important; display: flex; align-items: center; gap: 2px;">
          <i class="fas fa-clock"></i> ${driver.timeAway} minutes from you
        </p>
      </div>`
      );
    });
  } catch (error) {
    console.error("Error fetching round trip ride details:", error);
    showError("Could not calculate ride details. Please try again.");
    driverOptions.append(
      "<div class='option' data-type='noOption'>Could not calculate ride details. Please try again.</div>"
    );
  }
}

// Attachin' event listeners to dynamically added options for one-way
$("#oneWayDriverOptions").on("click", ".option", function () {
  const selectedOption = $(this).text();
  const selectBtn = $(".selectOneDriver .selectBtn");
  selectBtn.text(selectedOption).attr("data-type", $(this).attr("data-type"));
  $(this).closest(".selectDropdown").removeClass("toggle"); // Close dropdown
});

// Attachin' event listeners to dynamically added options for round trip
$("#roundTripCarDriverOptions").on("click", ".option", function () {
  const selectedOption = $(this).text();
  const selectBtn = $(".selectRoundDriver .selectBtn");
  selectBtn.text(selectedOption).attr("data-type", $(this).attr("data-type"));
  $(this).closest(".selectDropdown").removeClass("toggle"); // Close dropdown
  //4
  console.log(selectedOption);
});

$("#roundTripPassengerOptions").on("click", ".option", function () {
  const selectedOption = $(this).html(); // Get the HTML of the selected option (including icon)
  const selectBtn = $(".selectBtn.passO"); // Target the correct button
  selectBtn.html(selectedOption).attr("data-type", $(this).attr("data-type")); // Update the button with full HTML content
  $(this).closest(".selectDropdown").removeClass("toggle"); // Close the dropdown
  console.log("Selected Passengers:", $(this).text()); // Log the selected option text (without HTML)
  passengersRound = $(this).text(); // Store selected option text if needed
});

//// GETITN PICKUP POINT - ONE WAY

$(".selectOneFrom .selectDropdown .option").on("click", function () {
  const iconClass = $(this).data("icon");
  const text = $(this).data("text");

  // Buildin' the HTML with the icon and text
  const iconHtml = `<i class="${iconClass}"></i>`;
  $(".selectOneFrom .selectBtn").html(iconHtml + " " + text);

  updateAvailableRides();
});

//// GETITN PICKUP POINT -ROUND TRIP

$(".selectRoundFrom .selectDropdown .option").on("click", function () {
  const iconHtml = $(this).find("i").prop("outerHTML");
  const text = $(this).text().trim(); // Get the text only
  $(".selectRoundFrom .selectBtn").html(iconHtml + " " + text);
  updateAvailableRoundRides();
});

//// GETITN DESTINATION POINT - ROUND TRIP
$(".selectRoundTo .selectDropdown .option").on("click", function () {
  const iconHtml = $(this).find("i").prop("outerHTML");
  const text = $(this).text().trim(); // Get the text only
  $(".selectRoundTo .selectBtn").html(iconHtml + " " + text); // Set icon and text
  updateAvailableRoundRides(); // Update rides when "To" is selected
  //6
  toRound = text;
  console.log("Destination selected and stored:", text);
});

//// GETITin SELECTED DRIVER ONE WAY
$("#oneWayDriverOptions").on("click", ".option", function () {
  const iconHtml = $(this).find("i").prop("outerHTML"); // Capture icon HTML
  const driverText = $(this)
    .find("div")
    .contents()
    .filter(function () {
      return this.nodeType === Node.TEXT_NODE; // Get only the text node for driver details
    })
    .text()
    .trim(); // Get the text without the icon

  const selectBtn = $(".selectOneDriver .selectBtn");

  // Set the combined icon and driver text for display and update data attribute
  selectBtn
    .html(iconHtml + " " + driverText) // Combine icon and driver details
    .attr("data-type", $(this).attr("data-type"));
  $(this).closest(".selectDropdown").removeClass("toggle"); // Close dropdown

  // Store selected ride index
  selectedOneWayRideIndex = $(this).index();
});

//// GETITin SELECTED DRIVER ROUND TRIP

$("#roundTripCarDriverOptions").on("click", ".option", function () {
  const iconHtml = $(this).find("i").prop("outerHTML"); // Capture icon HTML
  const driverText = $(this)
    .find("div")
    .contents()
    .filter(function () {
      return this.nodeType === Node.TEXT_NODE; // Get only the text node for driver details
    })
    .text()
    .trim(); // Get the text without the icon

  const selectBtn = $(".selectRoundDriver .selectBtn"); // Change to round driver select button

  // Set the combined icon and driver text for display and update data attribute
  selectBtn
    .html(iconHtml + " " + driverText) // Combine icon and driver details
    .attr("data-type", $(this).attr("data-type"));
  $(this).closest(".selectDropdown").removeClass("toggle"); // Close dropdown

  // Store selected ride index
  selectedRoundTripRideIndex = $(this).index(); // Change to round trip index
  //7
  console.log(driverText);
});

//// BOOOKIN REAL FUNCTION
document.addEventListener("DOMContentLoaded", function () {
  // Book Now buttons
  const bookNowOneWayButton = document.querySelector(".book-now-one-way");
  const bookNowRoundTripButton = document.querySelector(".book-now-round-trip");

  // One-Way inputs
  const oneWayInputs = {
    from: document.querySelector('.left .selectBtn[data-type="fromOption"]'),
    to: oneTo, // Only get the element here
    departureDate: document.getElementById("sourcedatepicker"),
    passengers: document.querySelector(
      '.left .selectBtn[data-type="passengerOption"]'
    ),
  };

  // Round-Trip inputs
  const roundTripInputs = {
    from: document.querySelector('.round .selectBtn[data-type="fromOption"]'),
    to: document.querySelector('.round .selectBtn[data-type="toOption"]'),
    departureDate: document.getElementById("sourcedatepicker"),
    returnDate: document.getElementById("returndatepicker"),
    passengers: document.querySelector(
      '.round .selectBtn[data-type="passengerOption"]'
    ),
  };

  const receipt = document.querySelector(".receipt");
  const oneWayForm = document.querySelector(".left");
  const roundTripForm = document.querySelector(".round");
  const quoteText = document.querySelector("h3.getquotetext");

  // Helper function to validate dates
  function isValidFutureDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare only the date part
    return selectedDate >= today;
  }

  // Function to calculate price based on the selected locations and number of passengers AND THE DRIVER
  // Listen for clicks on driver options
  $(document).on("click", ".option.fromya", function () {
    // Remove 'selected' class from all options
    $(".option.fromya").removeClass("selected");

    // Add 'selected' class to the clicked option
    $(this).addClass("selected");

    // Extract the selected driver's details
    const selectedCar = $(this).data("car");
    const selectedDriver = $(this).data("driver");
    const selectedFare = parseFloat($(this).data("fare"));

    // Store the selection details globally or use them directly
    window.selectedDriverDetails = {
      car: selectedCar,
      driver: selectedDriver,
      fare: selectedFare,
      farePerKM: selectedFare / distanceKm,
    };

    console.log("Selected Driver:", window.selectedDriverDetails);
  });

  function calculatePrice(from, to, passengers, isRoundTrip = false) {
    if (!from || !to) {
      showError("Please provide both pickup and destination locations.");
      return null;
    }

    try {
      // Base fare calculation
      const baseFare = window.selectedDriverDetails.fare;

      // Parse passenger details
      const passengerCounts = passengers.match(
        /(\d+) Adults?(?:, (\d+) Child(?:ren)?)?/
      );
      const adultCount = passengerCounts ? parseInt(passengerCounts[1]) : 0;
      const childCount =
        passengerCounts && passengerCounts[2]
          ? parseInt(passengerCounts[2])
          : 0;

      // Calculate fares for adults and children
      const totalAdultPrice = baseFare * adultCount;
      const totalChildPrice = (baseFare / 2) * childCount;
      const totalBasePrice = totalAdultPrice + totalChildPrice;

      // Add tax (10%)
      const tax = totalBasePrice * 0.1;

      // Calculate final total price
      const totalPrice = isRoundTrip
        ? (totalBasePrice + tax) * 2
        : totalBasePrice + tax;

      // Return price breakdown
      return {
        carDetails: window.selectedDriverDetails.car,
        driver: window.selectedDriverDetails.driver,
        basePrice: isRoundTrip ? totalBasePrice * 2 : totalBasePrice,
        tax: isRoundTrip ? tax * 2 : tax,
        totalPrice,
      };
    } catch (error) {
      console.error("Error calculating price:", error);
      showError(
        "An error occurred while calculating the price. Please try again."
      );
      return null;
    }
  }

  // Function to display the receipt
  async function displayReceipt(
    tripType,
    from,
    to,
    departureDate,
    passengers,
    returnDate = ""
  ) {
    const isRoundTrip = tripType === "Round-Trip";
    const priceDetails = calculatePrice(from, to, passengers, isRoundTrip);
    if (!priceDetails) return;

    const { basePrice, tax, totalPrice } = priceDetails;

    const { car, driver, farePerKM } = window.selectedDriverDetails || {};

    let receiptHTML = `
      <div class="trip-detail-container">
        <div class="${
          isRoundTrip ? "round-trip-container" : "one-way-container"
        }">
          <h3 class="trip-detail-title">${tripType}</h3>
          <table>
            <tr><td>From</td><td>${from}</td></tr>
            <tr><td>To</td><td>${to}</td></tr>
            <tr><td>Passengers</td><td>${passengers}</td></tr>
            <tr><td>Departure Date</td><td>${departureDate}</td></tr>
            ${
              isRoundTrip
                ? `<tr><td>Return Date</td><td>${returnDate}</td></tr>`
                : ""
            }
          </table>
        </div>
        <hr>
        <div class="ride-details-container">
          <h3 class="trip-detail-title">Ride Details</h3>
          <table>
            <tr><td>Vehicle Selected:</td><td> ${car}</td></tr>
            <tr><td>Driver Selected:</td><td> ${driver}</td></tr>
            <tr><td>Fare per Kilometer:</td><td>KES ${farePerKM.toFixed(
              2
            )}</td></tr>
          </table>
        </div>
        <hr>
        <div class="price-container">
          <h3 class="trip-detail-title">Price</h3>
          <table>
            <tr><td>Base Price</td><td>KES ${basePrice}</td></tr>
            <tr><td>Tax</td><td>KES ${tax.toFixed(2)}</td></tr>
            <tr><td>Total Price</td><td>KES ${totalPrice.toFixed(2)}</td></tr>
          </table>
        </div>
        <hr>
        <h3 class="trip-detail-title">Route Overview: Distance & Est. Time</h3>
        <table class="map-details">
          <tr><td>🤩 Finding Route Please Wait 🚘...</td></tr>
        </table>
        <div id="map" style="height: 300px; width: 100%; margin-top: 20px;"></div>
        

        
      </div>
    `;

    oneWayForm.style.display = "none";
    roundTripForm.style.display = "none";
    receipt.innerHTML = receiptHTML;
    receipt.style.display = "block";

    const map = L.map("map").setView([0.0236, 37.9062], 6); // Centered in Kenya
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    async function getCoordinates(place) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      } else {
        showError(
          `Could not find location: ${place}. Using your current location instead.`
        );
        return new Promise((resolve, reject) => {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve([position.coords.latitude, position.coords.longitude]);
              },
              (error) => {
                showError(
                  "Failed to retrieve your location. Please check your settings."
                );
                reject(null);
              }
            );
          } else {
            showError("Geolocation is not supported by your browser.");
            reject(null);
          }
        });
      }
    }

    async function getRoute(fromPlace, toPlace) {
      console.log(fromPlace, toPlace);
      const startCoords = await getUserCurrentLocation();
      const endCoords = await getCoordinates(toPlace);

      if (startCoords && endCoords) {
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62482ca5ece423c340948ce5275be634f0a8&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`
        );
        const routeData = await response.json();

        if (routeData.features) {
          if (window.routeLayer) map.removeLayer(window.routeLayer);

          const routeCoords = routeData.features[0].geometry.coordinates.map(
            (coord) => [coord[1], coord[0]]
          );
          window.routeLayer = L.polyline(routeCoords, {
            color: "orange",
            weight: 5,
          }).addTo(map);

          L.marker(startCoords)
            .addTo(map)
            .bindPopup("🚘 Pickup: " + fromPlace)
            .openPopup();

          L.marker(endCoords)
            .addTo(map)
            .bindPopup("🚘 To: " + toPlace)
            .openPopup();

          map.fitBounds(window.routeLayer.getBounds());

          const distance = (
            routeData.features[0].properties.segments[0].distance / 1000
          ).toFixed(2);
          // Get duration in seconds from API data
          const durationInSeconds =
            routeData.features[0].properties.segments[0].duration;

          // Convert duration to hours and minutes
          let hours = Math.floor(durationInSeconds / 3600);
          let minutes = Math.round((durationInSeconds % 3600) / 60); // Remaining minutes

          // Create a human-readable duration text
          let durationText = "";
          if (hours > 0) {
            durationText += `${hours} Hour${hours > 1 ? "s" : ""}`; // Add hours if greater than 0
          }
          if (minutes > 0) {
            durationText +=
              (durationText ? " " : "") +
              `${minutes} Minute${minutes > 1 ? "s" : ""}`; // Add minutes if greater than 0
          }

          // Fallback if both hours and minutes are zero
          if (durationText === "") {
            durationText = "Less than a minute";
          }

          document.querySelector(".map-details").innerHTML = "";

          document.querySelector(
            ".map-details"
          ).innerHTML = `<tr><td>Total  Distance:</td><td>${distance} Kilometers</td></tr>
        <tr><td> Est. Travel Time:</td><td>${durationText}</td></tr>`;
        } else {
          message =
            "Could not retrieve route. Please check your locations and try again.";

          showError(message);
        }
      }
    }

    // Fetch and display route data
    getRoute(from, to);

    document.querySelector(".bookerz").style.display = "flex";
    document.querySelector(".booker").style.display = "block";
    document.querySelector(".booker").innerText = "Go to Payment";
    quoteText.innerText = "Checkout";
    quoteText.style.color = "grey";

    // Ensure the button only redirects after the text changes
    document.querySelector(".booker").addEventListener("click", () => {
      const buttonText = document.querySelector(".booker").innerText;

      if (buttonText === "Go to Payment") {
        window.location.href = "./Success/";
      } else {
        alert(
          "Please complete the required steps before proceeding to payment."
        );
      }
    });

    // Update the UI to prepare for checkout
    document.querySelector(".bookerz").style.display = "flex";
    document.querySelector(".booker").style.display = "block";
    document.querySelector(".booker").innerText = "Go to Payment";
    quoteText.innerText = "Checkout";
    quoteText.style.color = "grey";
  }

  //xxx One-Way Trip validation and booking
  bookNowOneWayButton.addEventListener("click", function () {
    const from = oneWayInputs.from.textContent.trim();
    const to = $(".selectOneTo .searchInput").val().trim();
    const departureDate = oneWayInputs.departureDate.value;
    const passengers = oneWayInputs.passengers.textContent.trim();

    // Validation for One-Way Trip
    if (
      !from ||
      !to ||
      !departureDate ||
      !passengers ||
      from === "Pickup Point" ||
      to === "Select Destination" ||
      passengers === "Choose People" ||
      from === "Select From List" ||
      to === "Select From List" ||
      passengers === "Select Driver"
    ) {
      showError("Please fill in all fields with valid details.");
      return;
    }

    if (!isValidFutureDate(departureDate)) {
      showError("The departure date must be today or a future date.");
      return;
    }

    // Display receipt if valid
    displayReceipt("One-Way", from, to, departureDate, passengers);
  });

  // Round-Trip validation and booking
  bookNowRoundTripButton.addEventListener("click", function () {
    const from = fromRound;
    const to = $(".selectRoundTo .searchInput").val().trim();
    const departureDate = departureDateRound;
    const passengers = passengersRound;
    const returnDate = returnDateRound;

    // Debugging: Check if the elements are correctly selected
    console.log("Round-Trip Inputs:", roundTripInputs);

    // Validation for Round-Trip
    if (
      !from ||
      !to ||
      !departureDate ||
      !returnDate ||
      !passengers ||
      from === "Pickup Point" ||
      to === "Select Destination" ||
      passengers === "Choose People" ||
      from === "Select From List" ||
      to === "Select From List" ||
      passengers === "Select From List"
    ) {
      showError("Please fill in all fields with valid details.");
      return;
    }

    if (!isValidFutureDate(departureDate)) {
      showError("The departure date must be today or a future date.");
      return;
    }

    if (new Date(returnDate) <= new Date(departureDate)) {
      showError("The return date must be later than the departure date.");
      return;
    }

    // Display receipt if valid
    displayReceipt(
      "Round-Trip",
      from,
      to,
      departureDate,
      passengers,
      returnDate
    );
  });
});

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
