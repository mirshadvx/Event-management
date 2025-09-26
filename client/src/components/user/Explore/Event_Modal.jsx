import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FaHashtag } from "react-icons/fa6";

const Event_Modal = ({ id, onClose }) => {
  const modalRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setImages([]);
      onClose();
    }
  };
  console.log(id);
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`event/preview-explore/${id}/`);
        console.log("Event preview", response);
        setEvent(response.data);
        const eventImages = [
          response.data?.event_banner,
          response.data?.promotional_image,
        ].filter(Boolean);
        setImages(eventImages);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  if (!id) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
        <div className="text-white text-lg font-medium flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
        <div className="text-white bg-red-600/80 px-4 py-2 rounded">
          Event not found
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50">
      <div
        ref={modalRef}
        className="flex w-full max-w-5xl h-[98vh] rounded-lg overflow-hidden shadow-2xl bg-black text-white"
      >
        <div className="w-1/3 bg-gradient-to-b max-h-[98vh] bg-[#72ca6a] pt-2 px-2 flex flex-col items-center justify-between">
          <div className="w-full">
            <Carousel
              className="w-full overflow-hidden rounded-xl"
              onSelect={(index) => setCurrentImageIndex(index)}
              opts={{ loop: images.length > 1 }}
            >
              <CarouselContent>
                {images.length > 0 ? (
                  images.map((url, index) => (
                    <CarouselItem key={index}>
                      <Card className="border-none p-0 shadow-none">
                        <CardContent className="p-0">
                          <div
                            className="relative w-full max-h-[60vh] overflow-hidden"
                            style={{ paddingTop: "166.67%" /* 5/3 * 100 */ }}
                          >
                            <img
                              src={url}
                              alt={`Event image ${index + 1}`}
                              className="absolute inset-0 w-full h-ful object-contain"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <Card className="border-none shadow-none">
                      <CardContent className="p-0">
                        <div
                          className="relative w-full max-h-[60vh] overflow-hidden"
                          style={{ paddingTop: "166.67%" }}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 rounded-md">
                            <svg
                              className="w-12 h-12 text-white/50 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-white text-sm font-medium">
                              No images available
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 bg-[#00FF82]/80 hover:bg-white/40 text-white border-none" />
                  <CarouselNext className="right-2 bg-[#00FF82]/80 hover:bg-white/40 text-white border-none" />
                </>
              )}
            </Carousel>
          </div>
          <div className=" w-full flex flex-col justify-between h-full text-black">
            <div>
              <p className="flex items-center">
                <FaHashtag />
                <span className="pl-1 text-xl font-bold">
                  {event.event_title}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium text-md pl-4">
                  {event.description}
                </span>
              </p>
              <p className="flex items-center gap-2 font-bold text-lg">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {event.start_date}
              </p>
            </div>
            <Button className="bg-white text-black-800 hover:bg-gray-100 font-bold px-4 py-2 rounded-md shadow-lg self-end mb-2">
              Detailed View
            </Button>
          </div>
        </div>

        {/* Right Section: Event Details */}
        <div className="w-1/2 flex flex-col h-full">
          <div className="p-4 flex items-center border-b border-gray-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center overflow-hidden mr-3">
              <img
                src={event.organizer_profile_picture}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium">{event.organizer_username}</span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-400 hover:underline cursor-pointer">
                Connect
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-black">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-start mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-pink-500 flex items-center justify-center overflow-hidden mr-3">
                  <img
                    src={event.organizer_profile_picture}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm">{event.description}</span>
                </div>
              </div>
            </div>

            {event.comments.map((comment, index) => (
              <div
                key={index}
                className="p-4 border-b border-gray-700 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={comment.profile_picture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.username}</span>
                      <span className="text-sm">{comment.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex justify-between mb-3">
                <div className="flex gap-4">
                  <button className="text-white hover:text-red-500 transition-colors">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                  <button className="text-white hover:text-blue-500 transition-colors">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-2 font-medium">{event.like_count} likes</div>
              <div className="text-gray-400 text-sm">{event.start_date}</div>
            </div>

            <div className="p-4 flex items-center border-t border-gray-700 gap-3">
              <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                className="bg-transparent flex-1 outline-none text-gray-400 hover:text-white focus:text-white transition-colors"
              />
              <button className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event_Modal;
