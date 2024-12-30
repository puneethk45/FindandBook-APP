import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, addDays } from 'date-fns';
import { Calendar } from 'react-native-calendars';

const DateTimePicker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);

  const availableTimeslots = [
    '9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am', '12:00pm', '12:30pm',
  ];

  const handleDateChange = (date) => {
    setSelectedDate(date.dateString);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDateChange}
        markedDates={{
          [selectedDate]: { selected: true, marked: true },
        }}
      />
      <View style={styles.timeslotContainer}>
        {availableTimeslots.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeslot,
              selectedTime === time ? styles.selectedTimeslot : null,
            ]}
            onPress={() => handleTimeSelect(time)}
          >
            <Text style={styles.timeslotText}>{time}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timeslotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  timeslot: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  selectedTimeslot: {
    backgroundColor: '#007aff',
  },
  timeslotText: {
    color: '#333',
    fontSize: 16,
  },
});

export default DateTimePicker;