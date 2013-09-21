#ifndef N_CONFIG_WIDGET_H
#define N_CONFIG_WIDGET_H

#include "n_json.h"
#include <QDir>
#include <QWidget>

namespace Ui {
class NConfigWidget;
}

class NConfigWidget : public QWidget
{
    Q_OBJECT

public:
    enum SCENE_COL {SCENE_COL_ID, SCENE_COL_CLASS, SCENE_COL_CLASS_FILE, SCENE_COL_LAYOUT, SCENE_COL_PAGE};
    enum PAGE_COL {PAGE_COL_ID, PAGE_COL_CLASS, PAGE_COL_CLASS_FILE, PAGE_COL_LAYOUT};
    explicit NConfigWidget(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    ~NConfigWidget();

private:
    Ui::NConfigWidget *ui;
    QDir *mProjectDir;
    QString mProjectName;
    NJson mConfigApp;
    NJson mConfigScene;
    NJson mConfigPage;

public slots:
    void saveConfig();

    void newScene();
    void removeScene();

    void newPage();
    void removePage();

    void contextMenuForConfigApp(QPoint point);
    void contextMenuForConfigScene(QPoint point);
    void contextMenuForConfigPage(QPoint point);

    void syncAppJsonToWidget();
    void syncSceneJsonToWidget();
    void syncPageJsonToWidget();

    void syncAppWidgetToJson();
    void syncSceneWidgetToJson();
    void syncPageWidgetToJson();

    void editConfigAppJson();
    void editConfigSceneJson();
    void editConfigPageJson();
};

#endif // N_CONFIG_WIDGET_H
