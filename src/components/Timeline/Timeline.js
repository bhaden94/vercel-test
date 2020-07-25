import React, { useState, useEffect } from "react";
import {withRouter} from "react-router-dom";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { MDBIcon } from "mdbreact";
import { useMediaQuery } from 'react-responsive'
import TimelineElement from "./TimelineElement";
import "react-vertical-timeline-component/style.min.css";



function Timeline({location}) {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  const loadingIcon = 
    <div className="spinner-border text-secondary" role="status">
      <span className="sr-only">Loading...</span>
    </div>

  const loadMoreBtn = 
    <MDBIcon className="timeline-card-load-btn" icon="plus" size="2x" />


  const fetchUpcoming = async () => {
    setYear(new Date().getFullYear())
    const res = await fetch("https://api.spacexdata.com/v4/launches/next")
    const json = await res.json()
    return json
  }

  // https://github.com/r-spacex/SpaceX-API/blob/master/docs/v4/launches/query.md
  const fetchPast = async () => {
    const reqOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: {
          date_utc: {
            $gte: `${year}-01-01T00:00:00.000Z`,
            $lte: `${year}-12-31T23:59:59.000Z`
          },
          $or: [
            {
              upcoming: false
            }
          ]
        },
        options: {
          sort: {
            date_utc: "desc"
          },
          populate: [
            {
              path: "past"
            }
          ],
          limit: "50"
        }
      })
    }
    const res = await fetch(`https://api.spacexdata.com/v4/launches/query`, reqOptions)
    const json = await res.json()
    setYear(year - 1)
    return json.docs
  }

  // this method still uses v3 of the spacexapi
  // v4 does not have history so continue using this
  // until we can replace the home page
  const fetchHistory = async () => {
    setYear(new Date().getFullYear())
    const res = await fetch("https://api.spacexdata.com/v3/history")
    const json = await res.json()
    return json
  }

  const detectPath = async () => {
    setIsLoading(true)
    let currentData
    if (location.pathname === "/upcoming") {
      currentData = await fetchUpcoming()
      currentData = [currentData]
    }
    else if (location.pathname === "/past") {
      currentData = await fetchPast()
    }
    else {
      currentData = await fetchHistory()
    }
    setData(currentData)
    setIsLoading(false)
  }

  const loadMore = async () => {
    setIsLoadingMore(true)
    const newData = await fetchPast()
    setData([...data, ...newData])
    setIsLoadingMore(false)
  }

  useEffect(() => {
    detectPath()
  }, [location])

  return (
     <div className="timeline">
        {isLoading ? loadingIcon :
          <div className="timeline-cards">
            <VerticalTimeline animate={isMobile ? false : true}>
              {data.map((e, index) => <TimelineElement key={index} data={e} />)}

              {location.pathname === "/past" ? 
              <VerticalTimelineElement
                iconOnClick={loadMore}
                iconClassName="timeline-card-load-more-icon"
                icon={isLoadingMore ? loadingIcon : loadMoreBtn}
              /> : 
              <VerticalTimelineElement
                iconClassName="timeline-card-load-icon"
              />}

            </VerticalTimeline>
          </div>}
      </div>
  );
}

export default withRouter(Timeline);
