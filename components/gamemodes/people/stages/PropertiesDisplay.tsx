'use client'

import { useGameContext } from '@/shared/GameContext';
import { PeopleStages, PeopleProperties, CONTINENTS, GENDERS, OCCUPATIONS } from '@/shared/types';
import { useEffect, useRef } from 'react';
import { useCountdown } from '@/shared/useCountdown';
import { capitalizeWords } from '@/shared/utils';

export default function PropertiesDisplay() {
    const { 
        host, 
        roomState,
        players, 
        submitPGUpdateStage, 
    } = useGameContext();

    const peopleState = roomState?.peopleState;
    const winningScore = peopleState?.settings.winningScore ?? 100;
    const properties = peopleState?.currentProperties ?? [];
    
    const remainingTime = useCountdown(roomState?.stageEndsAt, 2.5, roomState?.serverTime);
    const expiredStageRef = useRef<string>("");

    useEffect(() => {
        if (!host) return;

        const winner = players.find(player => player.score >= winningScore);
        if (winner) {
            submitPGUpdateStage(PeopleStages.Results);
            return;
        }

        if (remainingTime > 0) return;
        const key = `${roomState?.stageEndsAt ?? 'local'}`;
        if (expiredStageRef.current === key) return;
        expiredStageRef.current = key;
        submitPGUpdateStage(PeopleStages.GuessingPeriod);
    }, [host, players, winningScore, submitPGUpdateStage, remainingTime, roomState?.stageEndsAt]);

    const selectedContinents = properties.filter(p => CONTINENTS.includes(p));
    const selectedGenders = properties.filter(p => GENDERS.includes(p));
    const selectedOccupations = properties.filter(p => OCCUPATIONS.includes(p));

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-8 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col gap-16'>
                {/* Properties */}
                <h1 className='title font-bartle bg-dots'>
                    {properties.map(p => capitalizeWords(p.replace(/_/g, ' '))).join(', ')}
                </h1>
            </div>

            {/* Continents */}
            {selectedContinents.map(continent => (
                <p key={continent} className='heading1 font-bartle'>
                    The person must have held citizenship from the continent of {capitalizeWords(continent.replace(/_/g, ' '))} at some point during their life
                </p>
            ))}

            {/* Genders */}
            {selectedGenders.map(gender => (
                <p key={gender} className='heading1 font-bartle'>
                    The person must be {capitalizeWords(gender)}
                </p>
            ))}

            {/* Occupations */}
            {selectedOccupations.map(occupation => (
                <p key={occupation} className='heading1 font-bartle'>
                    The person must have been {occupation === PeopleProperties.Athlete ? 'an' : 'a'} {capitalizeWords(occupation)} at some point during their life
                </p>
            ))}
        </div>
    );
}