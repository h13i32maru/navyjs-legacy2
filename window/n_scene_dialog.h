#ifndef N_SCENE_DIALOG_H
#define N_SCENE_DIALOG_H

#include <QDialog>

#include <util/n_json.h>

namespace Ui {
class NSceneDialog;
}

class NSceneDialog : public QDialog
{
    Q_OBJECT

public:
    enum TYPE {TYPE_UPDATE, TYPE_CREATE};
    explicit NSceneDialog(TYPE type, NJson &configScene, QWidget *parent = 0);
    void setSceneId(const QString &sceneId);
    ~NSceneDialog();

private:
    Ui::NSceneDialog *ui;
    TYPE mType;
    NJson &mConfigScene;
    int mSceneIndex;
    int countScene(const QString &sceneId);
    int searchScene(const QString &sceneId);

private slots:
    void checkClassFile(const QString &path);
    void checkLayoutFile(const QString &path);
    void checkPage(const QString &page);
    void updateScene();
};

#endif // N_SCENE_DIALOG_H
