// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HealthConsultationBooking is Ownable {
    uint256 private _appointmentIdCounter;

    struct Appointment {
        uint256 id;
        address patient;
        address doctor;
        uint256 date;
        bool isConfirmed;
        bool isCompleted;
    }

    mapping(uint256 => Appointment) private _appointments;

    event AppointmentCreated(
        uint256 indexed appointmentId, address indexed patient, address indexed doctor, uint256 date
    );
    event AppointmentConfirmed(uint256 indexed appointmentId, address indexed doctor);
    event AppointmentCompleted(uint256 indexed appointmentId, address indexed doctor);

    modifier onlyPatient(uint256 appointmentId) {
        require(_appointments[appointmentId].patient == msg.sender, "Only patient");
        _;
    }

    modifier onlyDoctor(uint256 appointmentId) {
        require(_appointments[appointmentId].doctor == msg.sender, "Only doctor");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createAppointment(address doctor, uint256 date) external {
        uint256 appointmentId = _appointmentIdCounter;
        _appointments[appointmentId] = Appointment({
            id: appointmentId, patient: msg.sender, doctor: doctor, date: date, isConfirmed: false, isCompleted: false
        });
        _appointmentIdCounter++;
        emit AppointmentCreated(appointmentId, msg.sender, doctor, date);
    }

    function confirmAppointment(uint256 appointmentId) external onlyDoctor(appointmentId) {
        _appointments[appointmentId].isConfirmed = true;
        emit AppointmentConfirmed(appointmentId, msg.sender);
    }

    function completeAppointment(uint256 appointmentId) external onlyDoctor(appointmentId) {
        require(_appointments[appointmentId].isConfirmed, "Not confirmed");
        _appointments[appointmentId].isCompleted = true;
        emit AppointmentCompleted(appointmentId, msg.sender);
    }

    function getAppointment(uint256 appointmentId) external view returns (Appointment memory) {
        return _appointments[appointmentId];
    }
}
