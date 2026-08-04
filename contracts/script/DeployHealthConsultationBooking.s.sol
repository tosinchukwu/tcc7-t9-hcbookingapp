// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {HealthConsultationBooking} from "../src/HealthConsultationBooking.sol";

contract DeployHealthConsultationBooking is Script {
    function run() external {
        vm.startBroadcast();
        new HealthConsultationBooking();
        vm.stopBroadcast();
    }
}
