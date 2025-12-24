"use client";

import Tree from "@/public/tree.jpeg";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Motivation({isReadMoreVisible, toggleReadMoreVisibity}: {isReadMoreVisible?: boolean, toggleReadMoreVisibity?: ()=>void}) {
    
    return (
         <div className=" md:flex md:mx-28 py-20 justify-between hidden pt-32 md:pt-48">
        <div>
        <h1>See What Motivates Us</h1>
        <div className=" w-1/2 py-10">
          <p>See What Motivates Us</p>
          <p>
            We are inspired by a simple but powerful vision:
            <span className=" text-amber-400">
              to create a convenient, paperless electronic-invitation solution
              that helps people save time, reduce unnecessary costs, and enjoy a
              smoother event-planning experience.
            </span>
          </p>
          <p>
            Our commitment goes beyond technology—we aim to protect the
            environment by minimizing paper waste and reducing harm to our
            forests. Every feature we build is designed to make events easier,
            faster, and more sustainable for everyone.
          </p>
        </div>
        {isReadMoreVisible &&<Link href="/read-more" onClick={toggleReadMoreVisibity} className=" text-2xl text-amber-500 underline">Read More</Link>}
        </div>
        <div className="  content-center">
            <img src={Tree.src} alt="forest" className=" w-full"/>
        </div>
      </div>
    )
}