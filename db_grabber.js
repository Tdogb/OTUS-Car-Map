const flatpickr = require("flatpickr");

flatpickr("#datetime_selector", {
    mode: "multiple",
    enableTime: false,
    dateFormat: "Y-m-d",
    defaultDate: []
});

flatpickr("#starttime", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true
});

flatpickr("#endtime", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true
});

