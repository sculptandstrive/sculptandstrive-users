import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CalculatorContextType {
    macroResult: any;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({children}: {children: ReactNode}){
    const [macroResult, setMacroResult] = useState<any | null>(null);
    const {user} = useAuth();

    async function fetchCalculatorData(){
        const {data: MacroData, error: MacroError} = await supabase.from('macro_result').select('result').eq('user_id', user.id).single();
        // console.log("Macro Data is: ", MacroData);
        setMacroResult(MacroData);
    }

    useEffect(()=>{
        fetchCalculatorData();
    },[])

    return (
        <CalculatorContext.Provider value = {{macroResult}}>{children}</CalculatorContext.Provider>
    )
}

export function useCalculator() {
    const context = useContext(CalculatorContext);
    if(context === undefined){
        throw new Error("useContext must be used within an ContextProvider");
    }

    return context;
}