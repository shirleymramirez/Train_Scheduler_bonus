$(document).ready(function() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBXJPT2O8SDCrZextOvF1Kiuhz7E5vbDJc",
        authDomain: "trainschedulerbonus.firebaseapp.com",
        databaseURL: "https://trainschedulerbonus.firebaseio.com",
        projectId: "trainschedulerbonus",
        storageBucket: "trainschedulerbonus.appspot.com",
        messagingSenderId: "249730261069"
    };
    firebase.initializeApp(config);

    //------------------ Current Time Update on HTML page --------------------
    setInterval(function() {
        $("#currentTime").text(moment().format("MMMM Do YYYY, h:mm:ss a"));
    }, 1000);

    //------------------ Variable Declaration ----------------------------------
    var database = firebase.database();

    var trainName = "";
    var destination = "";
    var firstTrainTime = "";
    var frequency = "";

    //------------------ capture submit button click ------------------------------
    $("#inputForm").on("submit", function() {
        // storing and retrieving the most recent user.
        trainName = $("#trainNameInput").val().trim();
        destination = $("#destinationInput").val().trim();
        firstTrainTime = $("#firstTrainTimeInput").val().trim();
        frequency = $("#frequencyInput").val().trim();

        // store initial data to Firebase database.
        database.ref().push({
            trainName: trainName,
            destination: destination,
            firstTrainTime: firstTrainTime,
            frequency: frequency,
            timeAdded: firebase.database.ServerValue.TIMESTAMP
        });
        $("input").val("");
        return false;
    });

    //------------------ funtion for computation of next arrival and minutes away  ---------------
    function getNextArrivalAndMinutesAway(item) {

        // get current time in military format
        var firstTimeConverted = moment(item.firstTrainTime, "HH:mm");

        // get the difference of current time from the time converted in military time
        var diffTime = moment().diff(moment(firstTimeConverted));

        // get diff time in minutes
        var diffTimeInMinutes = moment().diff(moment(firstTimeConverted), "minutes");

        // get the time Remainder from diff in times and frequency
        var timeRemainder = diffTimeInMinutes % item.frequency;

        // calculate minutes away based from frequency and time remainder
        var minutesAway = item.frequency - timeRemainder;

        // check next arrival and nextTrain data
        var nextArrival;
        if (diffTimeInMinutes > 0) {
            var nextTrain = moment(firstTimeConverted + diffTime).add(minutesAway, "minutes");
            nextArrival = moment(nextTrain).format("HH:mm A");
        } else {
            minutesAway = Math.abs(diffTimeInMinutes);
            nextArrival = moment(firstTimeConverted).format("HH:mm A");
        }

        return {
            nextArrival,
            minutesAway,
        };
    }

    //----------------- firebase watcher on value event-----------------------------------------
    database.ref().on("child_added", function(childSnapshot) {
            //log everything that's coming out of snapshot
            var item = childSnapshot.val();
            var computedValues = getNextArrivalAndMinutesAway(item);
            // Change HTML Elements to reflect changes on Train Schedule Data Table Section
            $("#trainTable").append(
                "<tr class=\"" + childSnapshot.key + "\"><td>" + item.trainName + "</td>" +
                "<td>" + item.destination + "</td>" +
                "<td>" + "Every " + item.frequency + " min " + "</td>" +
                "<td id=\"nextArrivalDisplay\">" + computedValues.nextArrival + "</td>" +
                "<td id=\"minutesAwayDisplay\">" + computedValues.minutesAway + " minutes away" + "</td></tr>"
            );

            // Handle the errors
        },
        function(errorObject) {
            console.log("Errors handled: " + errorObject.code);
        }
    );
    //------ set interval function for updates of minutes to arrival and next train time ------------------
    setInterval(function() {

        // firebase watcher on value event
        database.ref().orderByValue().on("value", function(snapshot) {

            // store snapshot data value in a new variable
            var data = snapshot.val();

            // data checks
            if (data) {
                var keys = Object.keys(data);

                //for each data keys event 
                keys.forEach(key => {
                    var item = data[key];

                    // store data item from getNextArrivalandMinutesAway function
                    var computedValues = getNextArrivalAndMinutesAway(item);

                    // parent-child selector for nextArrivalDisplay
                    var arrivalSelector = $("tr." + key + " > #nextArrivalDisplay");
                    $(arrivalSelector).text(computedValues.nextArrival);

                    // parent-child selector for minutesAwayDisplay
                    var minutesSelector = "tr." + key + " > #minutesAwayDisplay";
                    $(minutesSelector).text(computedValues.minutesAway + " minutes away");

                });
            }
        });
    }, 60000);
    // ---------------------------------------------------------------------------------------------------
});