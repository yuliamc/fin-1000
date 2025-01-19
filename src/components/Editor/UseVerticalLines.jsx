import { useState, useEffect } from 'react';

const useVerticalLines = ({ canvasRef }) => {
    const [verticalLines, setVerticalLines] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragLineIndex, setDragLineIndex] = useState(null);

    const addVerticalLine = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const newX = canvas.width / 2;
        setVerticalLines(prev => [...prev, newX]);
    };

    const removeLastLine = () => {
        if (verticalLines.length === 0) return;
        setVerticalLines(prev => prev.slice(0, -1));
    };

    const getMousePosition = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        return (e.clientX - rect.left) * scaleX;
    };

    const handleMouseDown = (e) => {
        const x = getMousePosition(e);
        const lineIndex = verticalLines.findIndex(lineX =>
            Math.abs(lineX - x) < 20
        );

        if (lineIndex !== -1) {
            setIsDragging(true);
            setDragLineIndex(lineIndex);
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging || dragLineIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;

        setVerticalLines(prev => {
            const newLines = [...prev];
            newLines[dragLineIndex] = Math.max(0, Math.min(x, canvas.width));
            return newLines;
        });
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setDragLineIndex(null);
        }
    };

    const drawVerticalLines = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        verticalLines.forEach((x, index) => {
            // Draw the line
            context.beginPath();
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();

            // Draw the line number
            context.save();
            context.fillStyle = 'white';
            context.strokeStyle = 'red';
            context.lineWidth = 1;
            context.font = '14px Arial';
            const text = index.toString();
            const textWidth = context.measureText(text).width;
            const padding = 4;
            const boxWidth = textWidth + (padding * 2);
            const boxHeight = 20;

            // Draw background box
            context.fillStyle = 'red';
            context.fillRect(x - (boxWidth / 2), 0, boxWidth, boxHeight);

            // Draw text
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, x, boxHeight / 2);
            context.restore();
        });
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    return {
        verticalLines,
        isDragging,
        dragLineIndex,
        handleMouseUp,
        handleMouseDown,
        handleMouseMove,
        drawVerticalLines,
        addVerticalLine,
        removeLastLine,
    }
}

export default useVerticalLines;