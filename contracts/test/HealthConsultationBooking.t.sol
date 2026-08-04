// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {HealthConsultationBooking} from "../src/HealthConsultationBooking.sol";

contract HealthConsultationBookingTest is Test {
    HealthConsultationBooking public booking;
    address public patient = address(0x1);
    address public doctor = address(0x2);

    function setUp() public {
        booking = new HealthConsultationBooking();
    }

    function test_CreateAppointment() public {
        vm.prank(patient);
        booking.createAppointment(doctor, block.timestamp + 1 days);
        HealthConsultationBooking.Appointment memory app = booking.getAppointment(0);
        assertEq(app.id, 0);
        assertEq(app.patient, patient);
        assertEq(app.doctor, doctor);
        assertFalse(app.isConfirmed);
        assertFalse(app.isCompleted);
    }

    function test_ConfirmAppointment() public {
        vm.prank(patient);
        booking.createAppointment(doctor, block.timestamp + 1 days);
        vm.prank(doctor);
        booking.confirmAppointment(0);
        HealthConsultationBooking.Appointment memory app = booking.getAppointment(0);
        assertTrue(app.isConfirmed);
    }

    function test_CompleteAppointment() public {
        vm.prank(patient);
        booking.createAppointment(doctor, block.timestamp + 1 days);
        vm.prank(doctor);
        booking.confirmAppointment(0);
        vm.prank(doctor);
        booking.completeAppointment(0);
        HealthConsultationBooking.Appointment memory app = booking.getAppointment(0);
        assertTrue(app.isCompleted);
    }

    function test_OnlyDoctorCanConfirm() public {
        vm.prank(patient);
        booking.createAppointment(doctor, block.timestamp + 1 days);
        vm.prank(patient);
        vm.expectRevert("Only doctor");
        booking.confirmAppointment(0);
    }
}
