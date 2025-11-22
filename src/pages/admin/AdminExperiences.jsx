import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { newExperienceAPI } from '../../services/api';
import { calculateExperienceStatus, getStatusColorClass, getStatusLabel } from '../../utils/statusCalculator';
import StudioExperiences from '../studio/Experiences';

const AdminExperiences = () => {
    return <StudioExperiences/>
};

export default AdminExperiences;
