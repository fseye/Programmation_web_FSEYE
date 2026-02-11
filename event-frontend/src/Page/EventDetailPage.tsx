import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Event } from "../utils/types";
import { fetchAllEvents } from "../API/event-actions";
import "./styles/EventDetailPage.scss";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const allEvents = await fetchAllEvents();
        const found = allEvents.find(e => e.event_id === Number(eventId));
        if (found) {
          setEvent(found);
        } else {
          toast.error("Événement non trouvé");
          navigate("/events");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du chargement");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId, navigate]);

  if (loading) return <div className="event-detail-page"><p>Chargement...</p></div>;
  if (!event) return <div className="event-detail-page"><p>Événement non trouvé</p></div>;

  return (
    <div className="event-detail-page">
      <button className="back-btn" onClick={() => navigate("/events")}>← Retour</button>
      
      {event.image_url && (
        <div className="detail-image-section">
          <img src={event.image_url} alt={event.title} />
        </div>
      )}

      <div className="detail-content">
        <h1>{event.title}</h1>
        <p className="detail-category">📌 {event.category}</p>
        
        <div className="detail-info-grid">
          <div className="info-block">
            <span className="label">📅 Date</span>
            <span className="value">
              {event.event_date ? new Date(event.event_date).toLocaleDateString("fr-FR") : "-"}
            </span>
          </div>
          <div className="info-block">
            <span className="label">📍 Lieu</span>
            <span className="value">{event.location}</span>
          </div>
          <div className="info-block">
            <span className="label">👥 Participants</span>
            <span className="value">{event.nb_subscribers} / {event.max_subscribers}</span>
          </div>
        </div>

        <div className="detail-description">
          <h2>Description</h2>
          <p>{event.description || "Aucune description"}</p>
        </div>
      </div>
    </div>
  );
}
