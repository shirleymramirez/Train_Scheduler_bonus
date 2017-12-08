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
    //Run Clock
    setInterval(function() {
        $("#currentTime").text(moment().format("MMMM Do YYYY, h:mm:ss a"));
    }, 1000);

    var database = firebase.database();
    console.log("Database: " + database);

    var trainName = "";
    var destination = "";
    var firstTrainTime = "";
    var frequency = "";

    // capture submit button click
    $("#submitInfo").on("click", function() {
        event.preventDefault();

        // storing and retrieving the most recent user.
        trainName = $("#trainNameInput").val().trim();
        destination = $("#destinationInput").val().trim();
        firstTrainTime = $("#firstTrainTimeInput").val().trim();
        frequency = $("#frequencyInput").val().trim();

        console.log("TrainName: " + trainName);
        console.log("Destination: " + destination);
        console.log("FirstTrainTime: " + firstTrainTime);
        console.log("Frequency: " + frequency);

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

    // firebase watcher on value event
    database.ref().on(
        "child_added",
        function(childSnapshot) {
            //log everything that's coming out of snapshot
            var trainName = childSnapshot.val().trainName;
            var destination = childSnapshot.val().destination;
            var firstTrainTime = childSnapshot.val().firstTrainTime;
            var frequency = parseInt(childSnapshot.val().frequency);

            var firstTimeConverted = moment(firstTrainTime, "HH:mm").subtract(1, "years");
            var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
            var timeRemainder = diffTime % frequency;
            var minutesAway = frequency - timeRemainder;
            var nextTrain = moment().add(minutesAway, "minutes");
            var nextArrival = moment(nextTrain).format("HH:mm A");

            setInterval(timerUpdate, 60000);

            // Change HTML Elements to reflect changes on Train Schedule Data Table Section
            $("#trainTable").append(
                "<tr><td id='trainNameDisplay'>" + trainName +
                "</td><td id='destinationDisplay'>" + destination +
                "</td><td id='frequencyminDisplay'>" + "Every " + frequency + " min " +
                "</td><td id='nextArrivalDisplay'>" + nextArrival +
                "</td><td id='minutesAwayDisplay'>" + minutesAway + " minutes away" + "</td></tr>"
            );

            // Handle the errors
        },
        function(errorObject) {
            console.log("Errors handled: " + errorObject.code);
        }
    );

    function timerUpdate() {
        database.ref().orderByValue().on("value", function(snapshot) {
            var data = snapshot.val();
            var items = Object.values(data);
            items.forEach(item => {
                var firstTrainTime = item.firstTrainTime;
                var frequency = parseInt(item.frequency);


                console.log("trainName: " + item.trainName);
                console.log("destination: " + item.destination);
                console.log("firstTrainTime: " + item.firstTrainTime);
                console.log("frequency: " + item.frequency);
            });
        });
    }
});