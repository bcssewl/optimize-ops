"use client";

import { Button } from "@/src/components/ui/button";
import { createClient } from "@/src/lib/supabase/client";
import {
  faBrain,
  faBuilding,
  faChartBar,
  faChartPie,
  faExclamationTriangle,
  faEyeSlash,
  faFileLines,
  faHistory,
  faLightbulb,
  faLock,
  faMicrophone,
  faRocket,
  faUserCheck,
  faUserFriends,
  faUsers,
  faUserTie,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
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
      {/* HERO SECTION */}
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 px-4">
          <div className="flex-1 flex flex-col gap-6 justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight">
              Boost Employee Productivity with Smart Daily Voice Updates
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Streamline team performance tracking using voice inputs, AI
              analytics, and powerful departmental insights — all in one
              platform.
            </p>
            <div className="flex gap-4">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-4 flex items-center gap-2 bg-white text-primary font-bold hover:bg-gray-100"
              >
                <Link href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}>
                  <FontAwesomeIcon icon={faRocket} width={20} height={20} />
                  {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                </Link>
              </Button>{" "}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-primary"
              >
                <Link href="/auth/login">
                  <FontAwesomeIcon icon={faVideo} width={20} height={20} />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="/hero.png"
              alt="Dashboard Illustration"
              className="rounded-xl shadow-xl border-4 border-white"
              width={420}
              height={320}
            />
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-10 text-center text-gray-900">
          Pain Points We Solve
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="bg-red-100 text-red-600 rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faChartBar} width={32} height={32} />
            </span>
            <span className="font-medium text-gray-700">
              Managers struggle to track daily progress effectively
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-red-100 text-red-600 rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faEyeSlash} width={32} height={32} />
            </span>
            <span className="font-medium text-gray-700">
              Admins lack a clear view of team performance across departments
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-red-100 text-red-600 rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faFileLines} width={32} height={32} />
            </span>
            <span className="font-medium text-gray-700">
              Employees find written reports tedious and time-consuming
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-red-100 text-red-600 rounded-full p-4 mb-2">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                width={32}
                height={32}
              />
            </span>
            <span className="font-medium text-gray-700">
              Progress often goes undocumented or underreported
            </span>
          </div>
        </div>
      </section>

      {/* OUR SOLUTION */}
      <section className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Our Solution
          </h2>
          <p className="mb-6 text-lg text-gray-700">
            Let your team speak, we’ll take care of the rest.
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faUserCheck}
                width={20}
                height={20}
                className="text-primary"
              />{" "}
              Admins create departments and assign users.
            </li>
            <li className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faMicrophone}
                width={20}
                height={20}
                className="text-primary"
              />{" "}
              Managers and employees record short daily voice updates.
            </li>
            <li className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faChartPie}
                width={20}
                height={20}
                className="text-primary"
              />{" "}
              Our system automatically uploads and analyzes the voice content.
            </li>
            <li className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faLightbulb}
                width={20}
                height={20}
                className="text-primary"
              />{" "}
              Actionable reports are generated for admins, managers, and
              individuals — with zero manual effort.
            </li>
          </ul>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <Image
            src="/solution.png"
            alt="App Screenshot"
            className="rounded-xl shadow-xl border-4 border-primary"
            width={480}
            height={320}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-10 text-center text-gray-900">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center gap-3">
            <span className="bg-primary/10 text-primary rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faBuilding} width={32} height={32} />
            </span>
            <span className="font-semibold">Setup Your Team Structure</span>
            <span className="text-gray-600 text-center text-sm">
              Admins create departments and assign users with clear targets.
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-primary/10 text-primary rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faMicrophone} width={32} height={32} />
            </span>
            <span className="font-semibold">Record Daily Updates</span>
            <span className="text-gray-600 text-center text-sm">
              Supervisors and managers submit updates via voice recordings —
              quick and easy.
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-primary/10 text-primary rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faBrain} width={32} height={32} />
            </span>
            <span className="font-semibold">Smart AI Analysis</span>
            <span className="text-gray-600 text-center text-sm">
              The system transcribes, analyzes tone, detects key metrics, and
              evaluates progress.
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="bg-primary/10 text-primary rounded-full p-4 mb-2">
              <FontAwesomeIcon icon={faChartBar} width={32} height={32} />
            </span>
            <span className="font-semibold">Real-Time Reporting</span>
            <span className="text-gray-600 text-center text-sm">
              Admins and users see clean dashboards, trends, and individual
              reports.
            </span>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-gray-100">
          <span className="bg-primary/10 text-primary rounded-full p-4 mb-4">
            <FontAwesomeIcon icon={faUsers} width={32} height={32} />
          </span>
          <h3 className="text-xl font-bold mb-2 text-blue-700">For Admins</h3>
          <ul className="space-y-2 text-gray-700">
            <li>Department-wide visibility</li>
            <li>Easy performance tracking</li>
            <li>Centralized voice updates</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-gray-100">
          <span className="bg-primary/10 text-primary rounded-full p-4 mb-4">
            <FontAwesomeIcon icon={faUserTie} width={32} height={32} />
          </span>
          <h3 className="text-xl font-bold mb-2 text-green-700">
            For Managers & Supervisors
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>Hassle-free reporting via voice</li>
            <li>Automatic insights generation</li>
            <li>Trend tracking over time</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-gray-100">
          <span className="bg-primary/10 text-primary rounded-full p-4 mb-4">
            <FontAwesomeIcon icon={faUserFriends} width={32} height={32} />
          </span>
          <h3 className="text-xl font-bold mb-2 text-purple-700">
            For Team Members
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>See personal progress & feedback</li>
            <li>No need to write lengthy updates</li>
            <li>Feel heard and recognized</li>
          </ul>
        </div>
      </section>

      {/* KEY FEATURES GRID */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold mb-10 text-center text-gray-900">
          Key Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-lg text-gray-700">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faMicrophone}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            Voice-based daily updates
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faChartBar}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            Automated report generation
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faBrain}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            AI-based sentiment & progress analysis
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faBuilding}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            Department & user-level dashboards
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faLock}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            Secure uploads and access control
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faHistory}
              width={24}
              height={24}
              className="text-primary"
            />{" "}
            History of all updates per user
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="bg-primary py-24 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to transform your team's productivity?
        </h2>
        <p className="text-lg mb-8">
          Start tracking with voice. Save hours. Get real insights.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-4 flex items-center gap-2 bg-white text-primary font-bold hover:bg-gray-100"
          >
            <Link href="/auth/sign-up">
              <FontAwesomeIcon icon={faRocket} width={20} height={20} /> Get
              Started Free
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-primary">
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
