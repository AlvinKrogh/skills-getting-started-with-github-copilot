document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activities = {};

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderActivities() {
    activitiesList.replaceChildren();
    while (activitySelect.options.length > 1) {
      activitySelect.remove(1);
    }

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      activityCard.appendChild(title);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule:";
      const scheduleValue = document.createElement("span");
      scheduleValue.textContent = ` ${details.schedule}`;
      schedule.append(scheduleLabel, scheduleValue);
      activityCard.appendChild(schedule);

      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability:";
      const availabilityValue = document.createElement("span");
      availabilityValue.textContent = ` ${details.max_participants - details.participants.length} spots left`;
      availability.append(availabilityLabel, availabilityValue);
      activityCard.appendChild(availability);

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      activityCard.appendChild(participantsHeading);

      const participantsList = document.createElement("div");
      participantsList.className = "participants-list";
      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No participants yet.";
        participantsList.appendChild(emptyMessage);
      } else {
        details.participants.forEach((email) => {
          const participantRow = document.createElement("div");
          participantRow.className = "participant-row";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participantRow.appendChild(participantEmail);

          const unregisterButton = document.createElement("button");
          unregisterButton.type = "button";
          unregisterButton.textContent = "Unregister";
          unregisterButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          unregisterButton.addEventListener("click", () => unregisterFromActivity(name, email));
          participantRow.appendChild(unregisterButton);

          participantsList.appendChild(participantRow);
        });
      }
      activityCard.appendChild(participantsList);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      activities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.replaceChildren();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Failed to load activities. Please try again later.";
      activitiesList.appendChild(errorMessage);
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterFromActivity(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }

      activities[activity].participants = activities[activity].participants.filter(
        (participant) => participant !== email
      );
      renderActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        activities[activity].participants.push(email);
        renderActivities();
        showMessage(result.message, "success");
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
