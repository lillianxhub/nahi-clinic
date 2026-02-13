import { useEffect } from "react";

const usePageTitle = (pageName: string) => {
    useEffect(() => {
        const baseTitle = "NAHI Clinic";
        document.title = pageName ? `${baseTitle} | ${pageName}` : baseTitle;
    }, [pageName]);
};

export default usePageTitle;
