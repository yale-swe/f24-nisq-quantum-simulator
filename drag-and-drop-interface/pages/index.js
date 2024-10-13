import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';

const Home = () => {
  // Initial icon list
  const initialIcons = [
    { id: 'icon1', content: '/icons/icon1.svg' },
    { id: 'icon2', content: '/icons/icon2.svg' },
    { id: 'icon3', content: '/icons/icon3.svg' },
    { id: 'icon4', content: '/icons/icon4.svg' },
  ];

  // State for tracks (icons will not be removed from the original icons array)
  const [track1, setTrack1] = useState([]);
  const [track2, setTrack2] = useState([]);
  const [showTrack2, setShowTrack2] = useState(false); // Controls visibility via CSS, not conditional rendering

  // Function to move items between droppables (copying instead of removing)
  const move = (source, destination, droppableSource, droppableDestination) => {
    const destClone = Array.from(destination);
    const item = source[droppableSource.index]; // Copy the item
    destClone.splice(droppableDestination.index, 0, item);

    const result = {};
    result[droppableDestination.droppableId] = destClone;
    return result;
  };

  const onDragStart = () => {
    setShowTrack2(true); // Show Track 2 when dragging starts
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Hide Track 2 after drag ends
    setShowTrack2(false);

    // Dropped outside any droppable
    if (!destination) return;

    if (destination.droppableId === 'track1' || destination.droppableId === 'track2') {
      // Moving (copying) from the icons list to one of the tracks
      const result = move(
        initialIcons, // Always use initial icons to copy from
        getList(destination.droppableId),
        source,
        destination
      );

      if (destination.droppableId === 'track1') {
        setTrack1(result[destination.droppableId]);
      } else if (destination.droppableId === 'track2') {
        setTrack2(result[destination.droppableId]);
      }
    }
  };

  const getList = (id) => {
    if (id === 'track1') return track1;
    if (id === 'track2') return track2;
  };

  return (
    <div>
      <h1>Drag-and-Drop Icons</h1>
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Droppable for the icons */}
        <Droppable droppableId="icons" direction="horizontal">
          {(provided) => (
            <div className="icons" {...provided.droppableProps} ref={provided.innerRef}>
              {initialIcons.map((icon, index) => (
                <Draggable key={icon.id} draggableId={icon.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ cursor: 'grab', ...provided.draggableProps.style }}
                    >
                      <img src={icon.content} alt={icon.id} width="50" height="50" />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Track 1: Always visible */}
        <Droppable droppableId="track1" direction="horizontal">
          {(provided) => (
            <div className="track" {...provided.droppableProps} ref={provided.innerRef}>
              <h2>Track 1</h2>
              {track1.map((icon, index) => (
                <Draggable key={icon.id} draggableId={icon.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ cursor: 'grab', ...provided.draggableProps.style }}
                    >
                      <img src={icon.content} alt={icon.id} width="50" height="50" />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Track 2: Always rendered, but controlled visibility */}
        <Droppable droppableId="track2" direction="horizontal">
          {(provided) => (
            <div
              className="track"
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: showTrack2 ? 'flex' : 'none' }} // Toggle visibility via CSS
            >
              <h2>Track 2</h2>
              {track2.map((icon, index) => (
                <Draggable key={icon.id} draggableId={icon.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ cursor: 'grab', ...provided.draggableProps.style }}
                    >
                      <img src={icon.content} alt={icon.id} width="50" height="50" />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Home;
