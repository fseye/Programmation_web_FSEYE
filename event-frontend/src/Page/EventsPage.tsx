import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import {
  fetchAllEvents,
  fetchMyEvents,
  createEvent,
  subscribeEvent,
  unsubscribeEvent,
  updateEvent,
  fetchEventSubscribers,
  duplicateEventAPI
} from "../API/event-actions";

import type { Event } from "../utils/types";
import "./styles/EventsPage.scss";
import toast from "react-hot-toast";
import { z } from "zod";
import { EventSchema, type EventFormData } from "../utils/validation";
import { useNavigate } from "react-router-dom";

export default function EventsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxSubscribers, setMaxSubscribers] = useState<number>(20);
  const [category, setCategory] = useState("Autres");

  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Pagination / Scroll options
  const [viewMode, setViewMode] = useState<"pagination" | "infinite">("pagination");
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState(true);
  const [hasMorePast, setHasMorePast] = useState(true);

  // Category list
  const categories = ["Cinéma", "Études", "Sport", "Autres"];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Subscribers modal state
  const [subscribers, setSubscribers] = useState<{ id: number; username: string }[]>([]);
  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const [subscribersTitle, setSubscribersTitle] = useState("");

  // Image URL state
  const [imageUrl, setImageUrl] = useState("");

  const navigate = useNavigate();

  // Toggle dark/light
  function toggleDarkMode() {
    setDarkMode(prev => !prev);
  }

  function filterEvents(events: Event[]) {
    return events.filter(e =>
      `${e.title} ${e.description ?? ""} ${e.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (selectedCategory ? e.category === selectedCategory : true)
    );
  }

  // Reload events
  async function reloadEvents() {
    setLoading(true);
    try {
      const all = await fetchAllEvents();
      const mine = await fetchMyEvents();
      setAllEvents(all);
      setMyEvents(mine);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reloadEvents(); }, []);

  // Reset paging when filters/search change
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreUpcoming(true);
    setHasMorePast(true);
  }, [search, selectedCategory, itemsPerPage, viewMode, allEvents, myEvents]);

  // Create event handler
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    // Valider les données avec ZOD
    try {
      EventSchema.parse({
        title,
        description,
        eventDate,
        location,
        maxSubscribers,
        category,
        imageUrl,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        toast.error(firstError.message);
        return;
      }
    }

    setSubmitting(true);
    try {
      const event = await createEvent(title, description, eventDate, location, maxSubscribers, category, imageUrl);
      setImageUrl("");
      setAllEvents(prev => [event, ...prev]);
      setMyEvents(prev => [event, ...prev]);
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setCategory("Autres");
      setMaxSubscribers(20);
      toast.success("Événement créé avec succès !");
      setCreating(false);
      reloadEvents();
    } catch (err) {
      toast.error("Impossible de créer l'événement");
    }
    finally {
      setSubmitting(false);
    }
  }

  // Delete event handler
  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/events/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Événement supprimé avec succès ! ")
      if (!res.ok) throw new Error("Delete failed");
      reloadEvents();
    } catch { toast.error("Impossible de supprimer l'événement"); }
  }

  // Subscribe / Unsubscribe handlers
  async function handleSubscribe(eventId: number) {
    try {
      await subscribeEvent(eventId);
      toast.success("Inscription confirmée");
      reloadEvents();
    } catch {
      toast.error("Impossible de s'inscrire");
    }
  }

  async function handleUnsubscribe(eventId: number) {
    try {
      await unsubscribeEvent(eventId);
      toast("Désinscription effectuée");
      reloadEvents();
    } catch {
      toast.error("Erreur lors de la désinscription");
    }
  }

  async function openSubscribers(eventId: number, title: string) {
    try {
      setLoading(true);
      const list = await fetchEventSubscribers(eventId);
      setSubscribers(list);
      setSubscribersTitle(title);
      setSubscribersOpen(true);
    } catch (err) {
      toast.error("Impossible de récupérer les inscrits");
    } finally {
      setLoading(false);
    }
  }

  // Duplicate event handler
  async function handleDuplicate(eventId: number) {
    try {
      setSubmitting(true);
      const newEvent = await duplicateEventAPI(eventId);
      setAllEvents(prev => [newEvent, ...prev]);
      setMyEvents(prev => [newEvent, ...prev]);
      toast.success("Événement dupliqué avec succès !");
      reloadEvents();
    } catch (err) {
      toast.error("Impossible de dupliquer l'événement");
    } finally {
      setSubmitting(false);
    }
  }

  const logout = () => { localStorage.removeItem("token"); window.location.href = "/"; };

  // Filtering + pagination logic
  const today = new Date();
  const filteredUpcoming = filterEvents(allEvents).filter(e => new Date(e.event_date) >= today);
  const filteredPast = filterEvents(allEvents).filter(e => new Date(e.event_date) < today);

  const filteredUpcomingMine = filterEvents(myEvents).filter(e => new Date(e.event_date) >= today);
  const filteredPastMine = filterEvents(myEvents).filter(e => new Date(e.event_date) < today);

  // Derived slices for current view
  const totalUpcomingPages = Math.max(1, Math.ceil(filteredUpcoming.length / itemsPerPage));
  const totalPastPages = Math.max(1, Math.ceil(filteredPast.length / itemsPerPage));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const pagedUpcoming = filteredUpcoming.slice(startIndex, endIndex);
  const pagedPast = filteredPast.slice(startIndex, endIndex);

  const infiniteUpcoming = filteredUpcoming.slice(0, currentPage * itemsPerPage);
  const infinitePast = filteredPast.slice(0, currentPage * itemsPerPage);

  // Manage "hasMore" flags
  useEffect(() => {
    setHasMoreUpcoming(infiniteUpcoming.length < filteredUpcoming.length);
    setHasMorePast(infinitePast.length < filteredPast.length);
  }, [filteredUpcoming, filteredPast, infiniteUpcoming.length, infinitePast.length]);

  // Infinite scroll listener
  useEffect(() => {
    if (viewMode !== "infinite") return;
    function onScroll() {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
        setCurrentPage(prev => {
          const next = prev + 1;
          const maxPages = Math.ceil(Math.max(filteredUpcoming.length, filteredPast.length) / itemsPerPage);
          return Math.min(next, Math.max(1, maxPages));
        });
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [viewMode, itemsPerPage, filteredUpcoming.length, filteredPast.length]);

  return (
    <div className={`events-page ${darkMode ? "dark-mode" : "light-mode"}`}>

      {/* Header */}
      <header className="events-header">
        <h1>Événements</h1>

        {/* research + category */}
        <div className="header-controls">
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={selectedCategory === cat ? "active" : ""}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="header-buttons">
          <button className="create-btn" onClick={() => setCreating(true)}>➕ Créer</button>
          <button className="mode-btn" onClick={toggleDarkMode}>
            {darkMode ? " Light" : " Dark"}
          </button>
          <button className="logout-btn" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      {/* View options: Pagination / Infinite */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "0 1rem 1rem" }}>
        <label>
          <input type="radio" name="viewMode" checked={viewMode === "pagination"} onChange={() => { setViewMode("pagination"); setCurrentPage(1); }} />
          Pagination
        </label>
        <label>
          <input type="radio" name="viewMode" checked={viewMode === "infinite"} onChange={() => { setViewMode("infinite"); setCurrentPage(1); }} />
          Défilement 
        </label>

        <label style={{ marginLeft: 12 }}>
          Par page:
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ marginLeft: 8 }}>
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={12}>12</option>
          </select>
        </label>
      </div>

      {/* Tabs */}
      {loading ? <p>Chargement...</p> :
        <Tabs.Root defaultValue="all">
          <Tabs.List className="tabs-list">
            <Tabs.Trigger value="all">Tous</Tabs.Trigger>
            <Tabs.Trigger value="mine">Mes événements</Tabs.Trigger>
          </Tabs.List>

          {/* all events */}
          <Tabs.Content value="all">
            <h2>À venir</h2>
            {filteredUpcoming.length === 0 ? <p>Aucun événement à venir</p> :
              <>
                <div className="events-grid">
                  {(viewMode === "pagination" ? pagedUpcoming : infiniteUpcoming).map(e => (
                    <div 
                      key={e.event_id} 
                      className="event-card"
                      onClick={() => navigate(`/events/${e.event_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-image-section">
                        {e.image_url ? (
                          <img src={e.image_url} alt={e.title} className="card-image" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {e.title}
                          </div>
                        )}
                      </div>
                      
                      <div className="card-content">
                        <h2>{e.title}</h2>
                        <p className="card-category">📌 {e.category}</p>
                        <p className="card-info">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString() : "-"}</p>
                        <p className="card-info">📍 {e.location}</p>
                        <p className="card-info">👥 {e.nb_subscribers} / {e.max_subscribers}</p>
                        
                        <div className="card-button-group">
                          {e.max_subscribers && e.nb_subscribers < e.max_subscribers ? (
                            e.is_registered ? (
                              <button
                                className="card-icon-btn"
                                title="Se désinscrire"
                                onClick={async (ev) => { ev.stopPropagation(); await handleUnsubscribe(e.event_id); reloadEvents(); }}
                              >
                                ✖️
                              </button>
                            ) : (
                              <button
                                className="card-icon-btn"
                                title="S'inscrire"
                                onClick={async (ev) => { ev.stopPropagation(); await handleSubscribe(e.event_id); reloadEvents(); }}
                              >
                                ✔️
                              </button>
                            )
                          ) : (
                            <button className="card-icon-btn" disabled title="Complet">🚫</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination controls / Load more */}
                {viewMode === "pagination" ? (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Préc</button>
                    <span style={{ padding: "6px 10px" }}>{currentPage} / {totalUpcomingPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalUpcomingPages, p + 1))} disabled={currentPage >= totalUpcomingPages}>Suiv</button>
                  </div>
                ) : (
                  hasMoreUpcoming && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button onClick={() => setCurrentPage(p => p + 1)}>Charger plus</button>
                    </div>
                  )
                )}
              </>
            }

            <h2>Passés</h2>
            {filteredPast.length === 0 ? <p>Aucun événement passé</p> :
              <>
                <div className="events-grid">
                  {(viewMode === "pagination" ? pagedPast : infinitePast).map(e => (
                    <div 
                      key={e.event_id} 
                      className="event-card"
                      onClick={() => navigate(`/events/${e.event_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-image-section">
                        {e.image_url ? (
                          <img src={e.image_url} alt={e.title} className="card-image" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {e.title}
                          </div>
                        )}
                      </div>
                      
                      <div className="card-content">
                        <h2>{e.title}</h2>
                        <p className="card-category">📌 {e.category}</p>
                        <p className="card-info">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString() : "-"}</p>
                        <p className="card-info">📍 {e.location}</p>
                        <p className="card-info">👥 {e.nb_subscribers}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {viewMode === "pagination" ? (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Préc</button>
                    <span style={{ padding: "6px 10px" }}>{currentPage} / {totalPastPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPastPages, p + 1))} disabled={currentPage >= totalPastPages}>Suiv</button>
                  </div>
                ) : (
                  hasMorePast && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button onClick={() => setCurrentPage(p => p + 1)}>Charger plus</button>
                    </div>
                  )
                )}
              </>
            }
          </Tabs.Content>

          {/* My events */}
          <Tabs.Content value="mine">
            <h3>À venir</h3>
            {filteredUpcomingMine.length === 0 ? <p>Aucun événement à venir</p> :
              <div className="events-grid">
                {filteredUpcomingMine.map(e => (
                  <div 
                      key={e.event_id} 
                      className="event-card"
                      onClick={() => navigate(`/events/${e.event_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                    
                      <div className="card-image-section">
                        {e.image_url ? (
                          <img src={e.image_url} alt={e.title} className="card-image" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {e.title}
                          </div>
                        )}
                      </div>
                    
                    <div className="card-content">
                      <h2>{e.title}</h2>
                      <p className="card-category">📌 {e.category}</p>
                      <p className="card-info">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString() : "-"}</p>
                      <p className="card-info">📍 {e.location}</p>
                      <p className="card-info">👥 {e.nb_subscribers}</p>
                      
                      <div className="card-button-group">
                        <button
                          className="card-icon-btn"
                          title="Modifier"
                          onClick={(ev) => { ev.stopPropagation(); setEditingEvent(e); }}
                        >
                          ✏️
                        </button>
                        <button
                          className="card-icon-btn"
                          title="Dupliquer"
                          onClick={(ev) => { ev.stopPropagation(); handleDuplicate(e.event_id); }}
                        >
                          📋
                        </button>
                        <button
                          className="card-icon-btn"
                          title="Voir inscrits"
                          onClick={(ev) => { ev.stopPropagation(); openSubscribers(e.event_id, e.title); }}
                        >
                          👥
                        </button>
                        <button
                          className="card-icon-btn"
                          title="Supprimer"
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e.event_id); }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }

            <h3>Passés</h3>
            {filteredPastMine.length === 0 ? <p>Aucun événement passé</p> :
              <div className="events-grid">
                {filteredPastMine.map(e => (
                  <div 
                    key={e.event_id} 
                    className="event-card"
                    onClick={() => navigate(`/events/${e.event_id}`)}
                    style={{ cursor: "pointer" }}
                    >
                      <div className="card-image-section">
                        {e.image_url ? (
                          <img src={e.image_url} alt={e.title} className="card-image" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {e.title}
                          </div>
                        )}
                      </div>
                    
                    <div className="card-content">
                      <h2>{e.title}</h2>
                      <p className="card-category">📌 {e.category}</p>
                      <p className="card-info">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString() : "-"}</p>
                      <p className="card-info">📍 {e.location}</p>
                      <p className="card-info">👥 {e.nb_subscribers}</p>
                    </div>
                  </div>
                ))}
              </div>
            }
          </Tabs.Content>
        </Tabs.Root>
      }

      {/* Creation */}
      <Dialog.Root open={creating} onOpenChange={setCreating}>
        <Dialog.Overlay className="dialog-overlay"/>
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Créer un événement</Dialog.Title>
          <form onSubmit={handleCreate} className="create-form">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" required />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"></textarea>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Lieu" required />
            <input type="number" min={1} value={maxSubscribers} onChange={e => setMaxSubscribers(Number(e.target.value))} placeholder="Nombre de places" required />
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="URL de l'image de fond (optionnel)"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} required>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="modal-buttons">
              <button type="submit" disabled={submitting}>Créer</button>
              <Dialog.Close className="close-btn">✖ Annuler</Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* Modification */}
      {editingEvent && (
        <Dialog.Root open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <Dialog.Overlay className="dialog-overlay"/>
          <Dialog.Content className="dialog-content">
            <Dialog.Title>Modifier l'événement</Dialog.Title>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                EventSchema.parse({
                  title: editingEvent.title,
                  description: editingEvent.description || "",
                  eventDate: editingEvent.event_date || "",
                  location: editingEvent.location || "",
                  maxSubscribers: editingEvent.max_subscribers,
                  category: editingEvent.category || "Autres",
                  imageUrl: editingEvent.image_url || "",
                });
              } catch (err) {
                if (err instanceof z.ZodError) {
                  const firstError = err.issues[0];
                  toast.error(firstError.message);
                  return;
                }
              }
              try {
                const updated = await updateEvent(
                  editingEvent.event_id,
                  editingEvent.title,
                  editingEvent.description || "",
                  editingEvent.event_date || "",
                  editingEvent.location || "",
                  editingEvent.max_subscribers,
                  editingEvent.category || "Autres",
                  editingEvent.image_url || ""
                );
                toast.success("Evènement modifié avec succès");
                setAllEvents(prev => prev.map(ev => ev.event_id === updated.event_id ? updated : ev));
                setMyEvents(prev => prev.map(ev => ev.event_id === updated.event_id ? updated : ev));
                setEditingEvent(null);
              } catch {
                toast.error("Erreur lors de la modification");
              }
            }}>

              <input value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} required />
              <textarea value={editingEvent.description || ""} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}></textarea>
              <input type="date" value={editingEvent.event_date || ""} onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })} />
              <input value={editingEvent.location || ""} onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} required />
              <input type="number" min={1} value={editingEvent.max_subscribers ?? 5} onChange={e => setEditingEvent({ ...editingEvent, max_subscribers: Number(e.target.value) })} />
              <input
                type="url"
                value={editingEvent.image_url || ""}
                onChange={e => setEditingEvent({ ...editingEvent, image_url: e.target.value })}
                placeholder="URL de l'image de fond (optionnel)"
              />
              <select value={editingEvent.category ?? "Autres"} onChange={e => setEditingEvent({ ...editingEvent, category: e.target.value })} required>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="modal-buttons">
                <button type="submit">Sauvegarder</button>
                <Dialog.Close className="close-btn">Annuler</Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      )}

      <Dialog.Root open={subscribersOpen} onOpenChange={setSubscribersOpen}>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Inscrits — {subscribersTitle}</Dialog.Title>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {subscribers.length === 0 ? (
              <p>Aucun inscrit</p>
            ) : (
              <ul>
                {subscribers.map(s => (
                  <li key={s.id} style={{ padding: "6px 0", borderBottom: "1px solid #e878ae" }}>
                    {s.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Dialog.Close className="close-btn">Fermer</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}