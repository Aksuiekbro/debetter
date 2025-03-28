"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DebateEvaluationForm() {
  const [activeTab, setActiveTab] = useState("evaluation-table")

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6 flex items-center">
        <Link href="#" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="mx-auto text-center text-2xl font-bold">APF Debate Evaluation</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="font-medium">
                Teams: <span className="font-normal">Team 1 vs Team 2</span>
              </p>
              <p className="font-medium">
                Location: <span className="font-normal">123</span>
              </p>
            </div>
            <div>
              <p className="font-medium">
                Time: <span className="font-normal">Invalid Date</span>
              </p>
              <p className="font-medium">
                Theme: <span className="font-normal">Healthcare issues to be free of bias</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex justify-center">
        <Button className="bg-green-500 hover:bg-green-600">
          <Mic className="mr-2 h-4 w-4" />
          START
        </Button>
      </div>

      <Tabs defaultValue="evaluation-table" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evaluation-table">Evaluation Table</TabsTrigger>
          <TabsTrigger value="team-criteria">Team Criteria</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluation-table">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Criteria</th>
                      <th className="p-2 text-center">
                        Leader Gov
                        <br />
                        (14 min)
                      </th>
                      <th className="p-2 text-center">
                        Leader Opp
                        <br />
                        (14 min)
                      </th>
                      <th className="p-2 text-center">
                        Speaker Gov
                        <br />
                        (14 min)
                      </th>
                      <th className="p-2 text-center">
                        Speaker Opp
                        <br />
                        (14 min)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Content & Arguments</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Style & Delivery</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Strategy</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Total Score</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-criteria">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1">1) Behavioral Standards</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`bs-${num}`} name="behavioral-standards" className="h-4 w-4" />
                          <label htmlFor={`bs-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">2) Articulation/Clarity</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ac-${num}`} name="articulation-clarity" className="h-4 w-4" />
                          <label htmlFor={`ac-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      3) Reasoning and appeals <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ra-${num}`} name="reasoning-appeals" className="h-4 w-4" />
                          <label htmlFor={`ra-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      4) Rebuttal selection <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`rs-${num}`} name="rebuttal-selection" className="h-4 w-4" />
                          <label htmlFor={`rs-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      5) Structure and organization <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`so-${num}`} name="structure-organization" className="h-4 w-4" />
                          <label htmlFor={`so-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      6) Delivery (voice, gestures) <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`dv-${num}`} name="delivery" className="h-4 w-4" />
                          <label htmlFor={`dv-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      7) Visual/body language <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`vb-${num}`} name="visual-body" className="h-4 w-4" />
                          <label htmlFor={`vb-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      8) Proof/citations <span className="text-blue-500">...score?</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`pc-${num}`} name="proof-citations" className="h-4 w-4" />
                          <label htmlFor={`pc-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>The second team has the same standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>+ more info</p>
                  <p>+ more info</p>
                  <p>+ more overall of the judge</p>
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="text-2xl font-bold">VS</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persuasive Speech</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1">1) Factual evidence</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`fe-${num}`} name="factual-evidence" className="h-4 w-4" />
                          <label htmlFor={`fe-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">2) Voice segmentation</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`vs-${num}`} name="voice-segmentation" className="h-4 w-4" />
                          <label htmlFor={`vs-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">
                      3) Use of evidence <span className="text-blue-500">...</span>
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ue-${num}`} name="use-evidence" className="h-4 w-4" />
                          <label htmlFor={`ue-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Constructive speech</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>+ integrated speech</p>
                  <p>+ cross-examination</p>
                </div>
                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Winner</p>
                  <div className="mt-2 flex items-center justify-center">
                    <Button variant="outline">Dropdown UI / Choose who won</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debate Leadership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">Role/Leader</p>
                  <div>
                    <p className="mb-1">1) Clarity of definition/framing</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`cd-${num}`} name="clarity-definition" className="h-4 w-4" />
                          <label htmlFor={`cd-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">2) Argument construction</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ac-${num}`} name="argument-construction" className="h-4 w-4" />
                          <label htmlFor={`ac-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">3) Responsiveness to opponent</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ro-${num}`} name="responsiveness-opponent" className="h-4 w-4" />
                          <label htmlFor={`ro-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">4) Strategic positioning</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`sp-${num}`} name="strategic-positioning" className="h-4 w-4" />
                          <label htmlFor={`sp-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">5) Ability to summarize</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`as-${num}`} name="ability-summarize" className="h-4 w-4" />
                          <label htmlFor={`as-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Overall Speaker Feedback</p>
                  <p className="font-medium">Total points</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Speaker Opposition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">Role/Speaker</p>
                  <div>
                    <p className="mb-1">1) Rebuttal/refutation</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`rr-${num}`} name="rebuttal-refutation" className="h-4 w-4" />
                          <label htmlFor={`rr-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">2) New analysis/depth</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`na-${num}`} name="new-analysis" className="h-4 w-4" />
                          <label htmlFor={`na-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">3) Engagement with issues</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`ei-${num}`} name="engagement-issues" className="h-4 w-4" />
                          <label htmlFor={`ei-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">4) Coherence of position</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`cp-${num}`} name="coherence-position" className="h-4 w-4" />
                          <label htmlFor={`cp-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1">5) Timing and proper delivery</p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center space-x-1">
                          <input type="radio" id={`tp-${num}`} name="timing-delivery" className="h-4 w-4" />
                          <label htmlFor={`tp-${num}`}>{num}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score for opposite team's members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32"></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score for opposite team's members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32"></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="border-gray-300 text-gray-500">
          CANCEL
        </Button>
        <Button className="bg-gray-300 text-gray-700 hover:bg-gray-400">SUBMIT EVALUATION</Button>
      </div>
    </div>
  )
}

