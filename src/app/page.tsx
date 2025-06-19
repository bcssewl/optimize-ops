"use client";

import { Button } from "@/src/components/ui/button";
import { createClient } from "@/src/lib/supabase/client";
import {
  faBrain,
  faBuilding,
  faBullseye,
  faChartBar,
  faCheckCircle,
  faHistory,
  faLock,
  faMicrophone,
  faRocket,
  faTimesCircle,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-4 py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            Boost Employee Productivity with Smart Daily Voice Updates
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-4">
            Streamline team performance tracking using voice inputs, AI
            analytics, and powerful departmental insights — all in one platform.
          </p>
          <div className="flex gap-4 mb-6">
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-4 flex items-center gap-2"
              >
                <Link href="/dashboard">
                  <FontAwesomeIcon icon={faRocket} width={20} height={20} /> Go
                  to Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-8 py-4 flex items-center gap-2"
                >
                  <Link href="/auth/sign-up">
                    <FontAwesomeIcon icon={faRocket} width={20} height={20} />{" "}
                    Get Started Free
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 flex items-center gap-2"
                >
                  <Link href="/auth/login">
                    <FontAwesomeIcon icon={faVideo} width={20} height={20} />{" "}
                    Watch Demo
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Pain Points We Solve
          </h2>
          <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
            <li>
              <FontAwesomeIcon
                icon={faTimesCircle}
                className="text-red-500 mr-2"
                width={20}
                height={20}
              />
              Managers struggle to track daily progress effectively
            </li>
            <li>
              <FontAwesomeIcon
                icon={faTimesCircle}
                className="text-red-500 mr-2"
                width={20}
                height={20}
              />
              Admins lack a clear view of team performance across departments
            </li>
            <li>
              <FontAwesomeIcon
                icon={faTimesCircle}
                className="text-red-500 mr-2"
                width={20}
                height={20}
              />
              Employees find written reports tedious and time-consuming
            </li>
            <li>
              <FontAwesomeIcon
                icon={faTimesCircle}
                className="text-red-500 mr-2"
                width={20}
                height={20}
              />
              Progress often goes undocumented or underreported
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Our Solution
          </h2>
          <p className="mb-2">
            Let your team speak, we’ll take care of the rest.
          </p>
          <ul className="list-none pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Admins create departments and assign users.
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Managers and employees record short daily voice updates.
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Our system automatically uploads and analyzes the voice content.
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Actionable reports are generated for admins, managers, and
              individuals — with zero manual effort.
            </li>
          </ul>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <ol className="space-y-6 text-lg text-gray-700 dark:text-gray-300 list-inside list-none">
          <li>
            <FontAwesomeIcon
              icon={faBuilding}
              className="text-blue-500 mr-2"
              width={20}
              height={20}
            />
            <span className="font-semibold">Setup Your Team Structure:</span>{" "}
            Admins create departments and assign users with clear targets.
          </li>
          <li>
            <FontAwesomeIcon
              icon={faMicrophone}
              className="text-green-500 mr-2"
              width={20}
              height={20}
            />
            <span className="font-semibold">Record Daily Updates:</span>{" "}
            Supervisors and managers submit updates via voice recordings — quick
            and easy.
          </li>
          <li>
            <FontAwesomeIcon
              icon={faBrain}
              className="text-purple-500 mr-2"
              width={20}
              height={20}
            />
            <span className="font-semibold">Smart AI Analysis:</span> The system
            transcribes, analyzes tone, detects key metrics, and evaluates
            progress.
          </li>
          <li>
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-yellow-500 mr-2"
              width={20}
              height={20}
            />
            <span className="font-semibold">Real-Time Reporting:</span> Admins
            and users see clean dashboards, trends, and individual reports.
          </li>
        </ol>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-24 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-2 text-blue-700">For Admins</h3>
          <ul className="list-none pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Department-wide visibility
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Easy performance tracking
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Centralized voice updates
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 text-green-700">
            For Managers & Supervisors
          </h3>
          <ul className="list-none pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Hassle-free reporting via voice
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Automatic insights generation
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Trend tracking over time
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 text-purple-700">
            For Team Members
          </h3>
          <ul className="list-none pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              See personal progress & feedback
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              No need to write lengthy updates
            </li>
            <li>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 mr-2"
                width={20}
                height={20}
              />
              Feel heard and recognized
            </li>
          </ul>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-6 text-center">Key Features</h2>
        <ul className="grid md:grid-cols-3 gap-6 text-lg text-gray-700 dark:text-gray-300">
          <li>
            <FontAwesomeIcon
              icon={faMicrophone}
              className="text-blue-500 mr-2"
              width={20}
              height={20}
            />
            Voice-based daily updates
          </li>
          <li>
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-green-500 mr-2"
              width={20}
              height={20}
            />
            Automated report generation
          </li>
          <li>
            <FontAwesomeIcon
              icon={faBrain}
              className="text-purple-500 mr-2"
              width={20}
              height={20}
            />
            AI-based sentiment & progress analysis
          </li>
          <li>
            <FontAwesomeIcon
              icon={faBuilding}
              className="text-yellow-500 mr-2"
              width={20}
              height={20}
            />
            Department & user-level dashboards
          </li>
          <li>
            <FontAwesomeIcon
              icon={faLock}
              className="text-gray-700 dark:text-gray-300 mr-2"
              width={20}
              height={20}
            />
            Secure uploads and access control
          </li>
          <li>
            <FontAwesomeIcon
              icon={faHistory}
              className="text-gray-700 dark:text-gray-300 mr-2"
              width={20}
              height={20}
            />
            History of all updates per user
          </li>
        </ul>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to transform your team's productivity?
        </h2>
        <p className="text-lg mb-6">
          <FontAwesomeIcon
            icon={faBullseye}
            className="text-pink-500 mr-2"
            width={20}
            height={20}
          />
          Start tracking with voice. Save hours. Get real insights.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-4 flex items-center gap-2"
          >
            <Link href="/auth/sign-up">
              <FontAwesomeIcon icon={faRocket} width={20} height={20} /> Get
              Started Free
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 py-4 flex items-center gap-2"
          >
            <Link href="/auth/login">
              <FontAwesomeIcon icon={faVideo} width={20} height={20} /> Book a
              Demo
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
